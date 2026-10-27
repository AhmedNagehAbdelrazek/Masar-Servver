import { Injectable, Logger } from '@nestjs/common';
import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * SMS provider — Advance Messaging Systems (Broadnet) "websmpp" HTTP API.
 * Port of Main Server/Services/smsService.ts.
 *
 * Provider documentation: SMS_API.pdf and HLR_API.pdf (repository root).
 *
 * Endpoints (documented):
 * - Send SMS:            {base}/websmpp/websms            (HTTP/HTTPS, GET or POST)
 * - Message status:      {base}/websmpp/websmsstatus?respid=<messageId>
 * - Balance report:      {base}/websmpp/balanceReport     (balance=NN)
 * - HLR lookup:          {base}/websmpp/hlr/lookup        (returns BatchId)
 * - HLR instant lookup:  {base}/websmpp/hlr/lookupandresult
 * - HLR report:          {base}/websmpp/hlr/report?batchid=<BatchId>
 * - MNP report:          {base}/websmpp/mnp/report?batchid=<BatchId>
 *
 * Primary HTTPS gateway:  https://gwjo1s.broadnet.me:8443
 * Alternative:            http://82.212.81.40:8080
 *
 * Message `type` parameter (from SMS_API.pdf):
 *  1 = English (160 chars per SMS)
 *  2 = Unicode (280 chars per SMS)
 *  3 = Special characters (160 chars per SMS)
 *  4 = Arabic (70 chars per SMS)
 *
 * The provider reports success/failure in the response BODY, not the HTTP
 * status: a message id (or {"Response":["<id>"]}) on success, or
 * "ERROR - HTTPxx" (HTTP01..HTTP26) on failure.
 *
 * Credentials come from SMS_USERNAME / SMS_PASSWORD / SMS_SENDER_ID — they
 * are NOT hardcoded here.
 */

export interface SmsSendResponse {
  success: boolean;
  /** Provider message id returned on successful submission (use with checkSmsStatus). */
  messageId?: string;
  error?: string;
  /** Provider error code, e.g. "HTTP18" (insufficient balance). */
  errorCode?: string;
}

export interface SmsBalanceResponse {
  balance: number | null;
  error?: string;
}

export interface SmsStatusResponse {
  status: string;
  description: string;
  delivered?: boolean;
  error?: string;
}

export interface HlrLookupResponse {
  success: boolean;
  /** Batch id returned on submission — use with getHlrReport(). */
  batchId?: string;
  error?: string;
  errorCode?: string;
}

export interface HlrReportResponse {
  success: boolean;
  destination?: string;
  /** Country code of destination number. */
  cc?: string;
  /** Network code. */
  nnc?: string;
  /** Ported network code (if ported). */
  p_nnc?: string;
  isPorted?: boolean;
  isRoaming?: boolean;
  /** Roaming country code (if roaming). */
  r_cc?: string;
  /** Roaming network code (if roaming). */
  r_nnc?: string;
  msc?: string;
  imsi?: string;
  /** Lookup result status, e.g. DELIVRD when valid. */
  status?: string;
  errorCode?: string;
  error?: string;
  time?: string;
  errorName?: string;
}

/** ERROR - HTTPxx codes documented in SMS_API.pdf section 3.1. */
const PROVIDER_ERRORS: Record<string, string> = {
  HTTP01: 'Invalid HTTP URL format',
  HTTP02: 'Invalid query string',
  HTTP03: 'Message submission failed',
  HTTP04: 'Invalid password',
  HTTP05: 'Invalid system ID',
  HTTP06: 'Invalid sender ID',
  HTTP07: 'Invalid type',
  HTTP08: 'Invalid message ID',
  HTTP09: 'Invalid destination address',
  HTTP10: 'Invalid number of messages',
  HTTP11: 'Requested service is unavailable',
  HTTP12: 'Submit failed',
  HTTP13: 'Query request failed',
  HTTP14: 'Bind failed',
  HTTP15: 'Not authorized for the request',
  HTTP16: 'Invalid request',
  HTTP17: 'Invalid message length',
  HTTP18: 'Insufficient credits/balance',
  HTTP19: 'Invalid data coding scheme',
  HTTP20: 'Invalid ESM',
  HTTP21: 'Invalid header',
  HTTP22: 'Invalid schedule time',
  HTTP23: 'Routing error',
  HTTP24: 'Exceeded number of destinations',
  HTTP25: 'No record found',
  HTTP26: 'Account expired',
};

/** Status enquiry result tokens (SMS_API.pdf section 3.2). */
const DELIVERY_STATUSES: Record<string, string> = {
  ATES: 'Pending',
  DELIVRD: 'Delivered',
  UNDELIV: 'Undelivered',
  EXPIRED: 'Message validity period expired',
  REJECTD: 'Rejected',
  ACCEPTD: 'Accepted',
  DELETED: 'Deleted',
  UNKNOWN: 'Unknown',
};

const DELIVERED_STATUSES = new Set(['DELIVRD', 'ACCEPTD']);

const MESSAGE_TYPE = {
  ENGLISH: '1',
  UNICODE: '2',
  SPECIAL: '3',
  ARABIC: '4',
} as const;

/** Characters per single SMS by message type (SMS_API.pdf section 3.1). */
const TYPE_CHAR_LIMIT: Record<string, number> = {
  '1': 160,
  '2': 280,
  '3': 160,
  '4': 70,
};

const ARABIC_CHAR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const ASCII_ONLY = /^[\x20-\x7E]*$/;

const REQUEST_TIMEOUT_MS = 30000;

@Injectable()
export class WebsmppSmsService {
  private readonly logger = new Logger(WebsmppSmsService.name);
  private readonly baseUrl = process.env.SMS_PROVIDER_BASE || 'https://gwjo1s.broadnet.me:8443';
  private readonly username = process.env.SMS_USERNAME || '';
  private readonly password = process.env.SMS_PASSWORD || '';
  private readonly senderId = process.env.SMS_SENDER_ID || 'Masar Car';
  /** Optional override of auto-detected message type (1|2|3|4). */
  private readonly forcedType = process.env.SMS_MESSAGE_TYPE || '';

  private sanitizeMessage(message: string): string {
    // Characters [ ] { } | \ ~ ^ count twice, and & / # are restricted in
    // message content (SMS_API.pdf section 3.1 notes).
    return message.replace(/[&#]/g, '-');
  }

  private detectMessageType(message: string): string {
    if (['1', '2', '3', '4'].includes(this.forcedType)) return this.forcedType;
    if (ARABIC_CHAR.test(message)) return MESSAGE_TYPE.ARABIC;
    if (ASCII_ONLY.test(message)) return MESSAGE_TYPE.ENGLISH;
    return MESSAGE_TYPE.UNICODE;
  }

  /** Estimated parts count honoring the doubled-count characters. */
  private countMessageParts(message: string, type: string): number {
    const limit = TYPE_CHAR_LIMIT[type] ?? 160;
    const length = message
      .split('')
      .reduce((n, ch) => n + ('[]{}|\\~^'.includes(ch) ? 2 : 1), 0);
    return Math.ceil(length / limit);
  }

  /** Provider expects international format without the leading '+'. */
  private normalizePhone(phone: string): string {
    return phone.trim().replace(/^\+/, '');
  }

  private request(urlString: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<{ status?: number; body: string }> {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (result: { status?: number; body: string }): void => {
        if (!settled) {
          settled = true;
          resolve(result);
        }
      };

      try {
        const url = new URL(urlString);
        // Use the right transport for the scheme; the alternative gateway
        // (82.212.81.40:8080) is plain HTTP while the primary is HTTPS.
        const transport = url.protocol === 'https:' ? https : http;

        const req = transport.get(
          url,
          { timeout: timeoutMs, rejectUnauthorized: false },
          (res) => {
            let body = '';
            res.on('data', (chunk: string | Buffer): void => {
              body += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
            });
            res.on('end', () => settle({ status: res.statusCode, body }));
          }
        );

        req.on('error', (err) => settle({ status: undefined, body: err.message }));
        req.setTimeout(timeoutMs, () => {
          req.destroy();
          settle({ status: undefined, body: 'Request timeout' });
        });
      } catch (err) {
        settle({ status: undefined, body: (err as Error).message });
      }
    });
  }

  private hasCredentials(): boolean {
    return Boolean(this.username && this.password);
  }

  private credentialsError(): string {
    return 'SMS credentials are not configured (SMS_USERNAME / SMS_PASSWORD)';
  }

  /**
   * Send SMS via the websmpp HTTP API.
   * @param phone recipient phone number (international format, e.g. 96279xxxxxxx)
   * @param message SMS text content
   * @param opts.type overrides auto-detected message type (1|2|3|4)
   */
  async sendSms(phone: string, message: string, opts: { type?: string } = {}): Promise<SmsSendResponse> {
    if (!phone || !message) {
      return { success: false, error: 'Phone and message are required' };
    }
    if (!this.hasCredentials()) {
      return { success: false, error: this.credentialsError() };
    }

    try {
      const type = ['1', '2', '3', '4'].includes(opts.type || '') ? opts.type! : this.detectMessageType(message);
      const text = this.sanitizeMessage(message);

      const parts = this.countMessageParts(text, type);
      if (parts > 1) {
        this.logger.warn(
          `Message will be split into ${parts} SMS parts (type=${type}, limit=${TYPE_CHAR_LIMIT[type]}/part)`
        );
      }

      const url = new URL(`${this.baseUrl}/websmpp/websms`);
      url.searchParams.append('user', this.username);
      url.searchParams.append('pass', this.password);
      url.searchParams.append('sid', this.senderId);
      url.searchParams.append('mno', this.normalizePhone(phone));
      url.searchParams.append('type', type);
      url.searchParams.append('text', text);
      url.searchParams.append('respformat', 'json');

      const { status, body } = await this.request(url.toString());

      const errMatch = body.match(/ERROR\s*-\s*(HTTP\d{2})/i);
      if (errMatch) {
        const errorCode = errMatch[1].toUpperCase();
        this.logger.warn(`Send failed: ${errorCode} (${PROVIDER_ERRORS[errorCode] || body.trim()})`);
        return { success: false, errorCode, error: PROVIDER_ERRORS[errorCode] || body.trim() };
      }

      // Success (JSON format): {"Response":["1912181513205684021"]}
      try {
        const parsed = JSON.parse(body) as { Response?: string[] };
        const messageId = Array.isArray(parsed?.Response) ? parsed.Response[0] : null;
        if (messageId) return { success: true, messageId: String(messageId) };
      } catch {
        // not JSON — fall through
      }

      // Success (default plain format): "1507211343399277335"
      const plainId = body.trim().match(/^\d{10,}$/);
      if (plainId) return { success: true, messageId: plainId[0] };

      const error = body.trim() || `HTTP ${status}`;
      this.logger.warn(`Unexpected provider response: ${error}`);
      return { success: false, error };
    } catch (err) {
      this.logger.error(`Error sending SMS: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message || 'Failed to connect to SMS provider' };
    }
  }

  /**
   * Message status enquiry (SMS_API.pdf section 3.2).
   * @param respid message id returned by sendSms()
   */
  async checkSmsStatus(respid: string): Promise<SmsStatusResponse> {
    if (!respid) {
      return { status: 'UNKNOWN', description: DELIVERY_STATUSES.UNKNOWN, error: 'Message id is required' };
    }
    if (!this.hasCredentials()) {
      return { status: 'UNKNOWN', description: DELIVERY_STATUSES.UNKNOWN, error: this.credentialsError() };
    }

    try {
      const url = new URL(`${this.baseUrl}/websmpp/websmsstatus`);
      url.searchParams.append('respid', respid);

      const { status, body } = await this.request(url.toString());
      const token = body.trim().toUpperCase();
      const providerStatus = token && /^[A-Z]+$/.test(token) ? token : null;

      if (!providerStatus) {
        const message = body.trim() || `HTTP ${status}`;
        this.logger.warn(`Unexpected status response: ${message}`);
        return { status: 'UNKNOWN', description: DELIVERY_STATUSES.UNKNOWN, error: message };
      }

      return {
        status: providerStatus,
        description: DELIVERY_STATUSES[providerStatus] || providerStatus,
        delivered: DELIVERED_STATUSES.has(providerStatus),
      };
    } catch (err) {
      this.logger.error(`Error checking status: ${(err as Error).message}`);
      return { status: 'UNKNOWN', description: DELIVERY_STATUSES.UNKNOWN, error: (err as Error).message };
    }
  }

  /**
   * Check SMS provider balance (SMS_API.pdf section 3.3). Response body is
   * `balance=NN` (or similar); returns null when unparseable.
   */
  async checkSmsBalance(): Promise<SmsBalanceResponse> {
    if (!this.hasCredentials()) {
      return { balance: null, error: this.credentialsError() };
    }

    try {
      const url = new URL(`${this.baseUrl}/websmpp/balanceReport`);
      url.searchParams.append('userid', this.username);
      url.searchParams.append('password', this.password);

      const { status, body } = await this.request(url.toString());
      const balanceMatch = body.match(/balance[=:\s]*(\d+(?:\.\d+)?)/i);
      if (!balanceMatch) {
        const message = body.trim() || `HTTP ${status}`;
        this.logger.warn(`Unexpected balance response: ${message}`);
        return { balance: null, error: message };
      }

      return { balance: parseInt(balanceMatch[1], 10) };
    } catch (err) {
      this.logger.error(`Error checking balance: ${(err as Error).message}`);
      return { balance: null, error: (err as Error).message || 'Failed to connect to SMS provider' };
    }
  }

  /**
   * Submit an HLR number lookup (HLR_API.pdf section 2.2 HTTP API).
   * A GET returning "BatchId: <id>" on success, or "ERROR - HTTPxx" on
   * failure. Pick up the result later with getHlrReport().
   */
  async hlrLookup(destination: string): Promise<HlrLookupResponse> {
    if (!destination) {
      return { success: false, error: 'Destination number is required' };
    }
    if (!this.hasCredentials()) {
      return { success: false, error: this.credentialsError() };
    }

    try {
      const url = new URL(`${this.baseUrl}/websmpp/hlr/lookup`);
      url.searchParams.append('username', this.username);
      url.searchParams.append('password', this.password);
      url.searchParams.append(
        'destination',
        destination.split(',').map((p) => this.normalizePhone(p)).join(',')
      );

      const { status, body } = await this.request(url.toString());

      const errMatch = body.match(/ERROR\s*-\s*(HTTP\d{2})/i);
      if (errMatch) {
        const errorCode = errMatch[1].toUpperCase();
        return { success: false, errorCode, error: PROVIDER_ERRORS[errorCode] || body.trim() };
      }

      const batchMatch = body.match(/BatchId[:=]\s*(\d+)/i);
      if (batchMatch) return { success: true, batchId: batchMatch[1] };

      const error = body.trim() || `HTTP ${status}`;
      this.logger.warn(`Unexpected HLR lookup response: ${error}`);
      return { success: false, error };
    } catch (err) {
      this.logger.error(`Error during HLR lookup: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message || 'Failed to connect to HLR provider' };
    }
  }

  /**
   * HLR lookup returning the report immediately (HLR_API.pdf section 1.2).
   */
  async hlrLookupAndResult(destination: string): Promise<HlrReportResponse> {
    if (!destination) {
      return { success: false, error: 'Destination number is required' };
    }
    if (!this.hasCredentials()) {
      return { success: false, error: this.credentialsError() };
    }

    try {
      const url = new URL(`${this.baseUrl}/websmpp/hlr/lookupandresult`);
      url.searchParams.append('username', this.username);
      url.searchParams.append('password', this.password);
      url.searchParams.append('destination', this.normalizePhone(destination));

      const { status, body } = await this.request(url.toString());

      const errMatch = body.match(/ERROR\s*-\s*(HTTP\d{2})/i);
      if (errMatch) {
        const errorCode = errMatch[1].toUpperCase();
        return { success: false, errorCode, error: PROVIDER_ERRORS[errorCode] || body.trim() };
      }

      try {
        const parsed = JSON.parse(body) as HlrReportResponse;
        if (parsed?.destination) return this.mapHlrReport(parsed);
      } catch {
        // not JSON — fall through
      }

      const batchMatch = body.match(/BatchId[:=]\s*(\d+)/i);
      if (batchMatch) {
        return {
          success: false,
          error: `Lookup queued with batchId ${batchMatch[1]} — call getHlrReport() later`,
        };
      }

      const error = body.trim() || `HTTP ${status}`;
      this.logger.warn(`Unexpected HLR lookup response: ${error}`);
      return { success: false, error };
    } catch (err) {
      this.logger.error(`Error during HLR lookup: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message || 'Failed to connect to HLR provider' };
    }
  }

  /** Submit-time (lookup) status codes — HLR_API.pdf Status Code Table (1). */
  private static HLR_SUBMIT_ERRORS: Record<string, string> = {
    '001': 'Invalid login (system id or password incorrect)',
    '002': 'Invalid request (missing/invalid parameters)',
    '003': 'Account expired',
    '004': 'Insufficient balance',
    '005': 'Invalid destination address',
    '006': 'No coverage for requested destination',
    '007': 'System error',
  };

  /** Result status codes — HLR_API.pdf Status Code Table (2). */
  private static HLR_RESULT_ERRORS: Record<string, string> = {
    '011': 'Absent subscriber',
    '012': 'Unknown subscriber',
    '013': 'Unidentified subscriber',
    '014': 'Timeout',
    '015': 'Provider general error',
    '016': 'No response from provider',
    '017': 'System failure',
    '018': 'Invalid msisdn',
    '019': 'Call barred',
    '020': 'Illegal subscriber',
    '021': 'Teleservice not provisioned',
    '022': 'Facility not supported',
    '023': 'Subscriber busy for MT SMS',
    '024': 'Unexpected data value',
    '025': 'Temporary absent subscriber',
    '026': 'Delivery failure',
  };

  private mapHlrReport(raw: any): HlrReportResponse {
    const yesNo = (v: any) => v === true || String(v).toLowerCase() === 'yes';
    const report: HlrReportResponse = {
      success: false,
      destination: raw.destination,
      cc: raw.cc,
      nnc: raw.nnc,
      p_nnc: raw.p_nnc,
      isPorted: raw.isPorted === undefined ? undefined : yesNo(raw.isPorted),
      isRoaming: raw.isRoaming === undefined ? undefined : yesNo(raw.isRoaming),
      r_cc: raw.r_cc,
      r_nnc: raw.r_nnc,
      msc: raw.msc,
      imsi: raw.imsi,
      status: raw.status,
      errorCode: raw.error_code,
      error: raw.error,
      time: raw.time,
      errorName: raw.error && raw.error !== 'NO_ERROR' ? raw.error : undefined,
    };

    const hasError = report.errorCode && report.errorCode !== '000';
    if (hasError) {
      report.error =
        WebsmppSmsService.HLR_RESULT_ERRORS[report.errorCode!] ||
        WebsmppSmsService.HLR_SUBMIT_ERRORS[report.errorCode!] ||
        report.errorName ||
        report.error ||
        `Provider error ${report.errorCode}`;
    }

    const delivered = report.status === 'DELIVRD';
    report.success = Boolean(!hasError && (delivered || report.imsi || report.nnc));
    return report;
  }

  /**
   * Fetch an HLR/MNP lookup report (HLR_API.pdf section 2.2 Status Enquiry).
   * @param batchId batch id from hlrLookup()
   * @param mode 'hlr' (default) or 'mnp' (portability-only report)
   */
  async getHlrReport(batchId: string, mode: 'hlr' | 'mnp' = 'hlr'): Promise<HlrReportResponse> {
    if (!batchId || batchId.length !== 15) {
      return { success: false, error: 'Batch id is required (must be 15 digits)' };
    }
    if (!this.hasCredentials()) {
      return { success: false, error: this.credentialsError() };
    }

    try {
      const url = new URL(`${this.baseUrl}/websmpp/${mode}/report`);
      url.searchParams.append('batchid', batchId);

      const { status, body } = await this.request(url.toString());

      const errMatch = body.match(/ERROR\s*-\s*(HTTP\d{2})/i);
      if (errMatch) {
        const errorCode = errMatch[1].toUpperCase();
        return { success: false, errorCode, error: PROVIDER_ERRORS[errorCode] || body.trim() };
      }

      try {
        const parsed = JSON.parse(body) as HlrReportResponse;
        if (parsed?.destination) return this.mapHlrReport(parsed);
        if (Array.isArray(parsed) && parsed.length > 0) return this.mapHlrReport(parsed[0]);
      } catch {
        // not JSON — fall through
      }

      const error = body.trim() || `HTTP ${status}`;
      this.logger.warn(`Unexpected HLR report response: ${error}`);
      return { success: false, error };
    } catch (err) {
      this.logger.error(`Error fetching HLR report: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message || 'Failed to connect to HLR provider' };
    }
  }

  /**
   * Send password reset SMS to a user's phone.
   * @param phone recipient phone number
   * @param resetCode the 6-digit reset code to send
   */
  async sendPasswordResetSms(phone: string, resetCode: string): Promise<SmsSendResponse> {
    const message = `رمز إعادة تعيين كلمة المرور: ${resetCode}. للمنصة Masar Car. رسالة صالحة لمدة 10 دقائق.`;
    return this.sendSms(phone, message);
  }
}
