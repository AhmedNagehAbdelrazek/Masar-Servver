// @ts-nocheck
import https from 'https';
import { URL } from 'url';

/**
 * SMS Service - integrates with the external SMS provider.
 * 
 * Provider endpoints from registration:
 * - Send SMS: http://82.212.81.40:8080/websmpp/websms
 * - Alternative Send SMS: https://gwjo1s.broadnet.me:8443/websmpp/websms
 * - Balance Report: https://gwjo1s.broadnet.me:8443/websmpp/balanceReport
 * 
 * Credentials:
 * - username: MasarCar6
 * - password: 183M@BcYR
 * - senderid: Masar Car
 * 
 * Note: This is a thin integration - just calls the SMS provider API.
 * No server-side state persistence, no Redis storage, no token revocation.
 * The SMS endpoints are used once to set up the service.
 */

const SMS_PROVIDER_BASE = process.env.SMS_PROVIDER_BASE || 'http://82.212.81.40:8080';
const SMS_USERNAME = process.env.SMS_USERNAME || 'MasarCar6';
const SMS_PASSWORD = process.env.SMS_PASSWORD || '183M@BcYR';
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'Masar Car';

export interface SmsSendResponse {
  success: boolean;
  error?: string;
}

/**
 * Send SMS via the external SMS provider
 * @param phone recipient phone number (full international format)
 * @param message SMS text content
 */
export async function sendSms(phone: string, message: string): Promise<SmsSendResponse> {
  try {
    const encodedMessage = encodeURIComponent(message);
    const url = new URL(`${SMS_PROVIDER_BASE}/websmpp/websms`);
    url.searchParams.append('user', SMS_USERNAME);
    url.searchParams.append('pass', SMS_PASSWORD);
    url.searchParams.append('sid', SMS_SENDER_ID);
    url.searchParams.append('mno', phone);
    url.searchParams.append('type', '4');
    url.searchParams.append('text', encodedMessage);
    
    const options: https.RequestOptions = {
      timeout: 30000,
    };
    
    const response = await new Promise<SmsSendResponse>((resolve, reject) => {
      const req = https.get(url.toString(), options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
          
          if (isSuccess) {
            resolve({ success: true });
          } else {
            console.warn('[smsProvider] Unexpected response status:', res.statusCode, 'body:', data);
            resolve({ success: false, error: data || `HTTP ${res.statusCode}` });
          }
        }
      });
      
      req.on('error', (err) => {
        console.error('[smsProvider] Error sending SMS:', err.message);
        resolve({ success: false, error: err.message || 'Failed to connect to SMS provider' });
      });
      
      req.setTimeout(30000, () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });
    });
    
    return response;
  } catch (error: any) {
    console.error('[smsProvider] Error sending SMS:', error.message);
    return { success: false, error: error.message || 'Failed to connect to SMS provider' };
  }
}

/**
 * Check SMS provider balance (thin - just calls API, no storage)
 */
export async function checkSmsBalance(): Promise<{ balance: number; error?: string }> {
  try {
    const url = new URL(`${SMS_PROVIDER_BASE}/websmpp/balanceReport`);
    url.searchParams.append('userid', SMS_USERNAME);
    url.searchParams.append('password', SMS_PASSWORD);
    
    const response = await new Promise<{ balance: number; error?: string }>((resolve, reject) => {
      https.get(url.toString(), (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const balanceMatch = data.match(/balance[=:]\s*(\d+)/i);
          const balance = balanceMatch ? parseInt(balanceMatch[1], 10) : 0;
          
          resolve({ balance, error: undefined });
        }
      });
      
      req.on('error', (err) => {
        console.error('[smsProvider] Error checking balance:', err.message);
        resolve({ balance: 0, error: err.message || 'Failed to connect to SMS provider' });
      });
    });
    
    return response;
  } catch (error: any) {
    console.error('[smsProvider] Error checking balance:', error.message);
    return { balance: 0, error: error.message || 'Failed to connect to SMS provider' };
  }
}

/**
 * Send password reset SMS to a user's phone (thin - just sends SMS, no storage)
 * @param phone recipient phone number
 * @param resetCode the 6-digit reset code to send
 */
export async function sendPasswordResetSms(phone: string, resetCode: string): Promise<SmsSendResponse> {
  const message = `رمز إعادة تعيين كلمة المرور: ${resetCode}. للمنصة Masar Car. رسالة صالحة لمدة 10 دقائق.`;
  return sendSms(phone, message);
}

export default {
  sendSms,
  checkSmsBalance,
  sendPasswordResetSms,
};
export { sendSms, checkSmsBalance, sendPasswordResetSms };