# Garage object storage

The API servers upload images to a self-hosted [Garage](https://garagehq.deuxfleurs.fr/)
cluster. Garage is S3-compatible, so the existing `s3` upload provider is used
with a custom endpoint.

## Runtime configuration

Set these on the API service (Coolify → Environment Variables, or
`main-server/.env` for the Docker Compose stack):

```dotenv
UPLOAD_PROVIDER=s3
S3_BUCKET=masar
S3_REGION=garage
S3_ENDPOINT=https://s3-moo8femylvwkoneyiarpl67b.72.60.35.244.sslip.io
S3_FORCE_PATH_STYLE=true
S3_ACCESS_KEY_ID=<access key id>
S3_SECRET_ACCESS_KEY=<secret access key>
S3_BASE_URL=https://web-moo8femylvwkoneyiarpl67b.72.60.35.244.sslip.io
```

Mapping from the Coolify/Garage variable names:

| Garage / Coolify | Server |
| --- | --- |
| `BUCKET_URL` | `S3_ENDPOINT` |
| `BUCKET_ACCESS_KEY` | `S3_ACCESS_KEY_ID` |
| `BUCKET_SERCERT_KEY` | `S3_SECRET_ACCESS_KEY` |
| bucket name (`masar`) | `S3_BUCKET` + `S3_REGION=garage` |
| public web endpoint | `S3_BASE_URL` |

`S3_ENDPOINT` + path-style enables Garage/MinIO; `S3_BASE_URL` is only used to
build the URL returned to clients. Objects are stored under
`uploads/<timestamp>-<random>.<ext>` and the returned URL is
`<S3_BASE_URL>/<key>`. `S3_PUBLIC_URL` is accepted as an alias for
`S3_BASE_URL`.

> Important: `S3_BASE_URL` must be the **public web endpoint**, not the signed
> S3 endpoint. If it is omitted, the uploader falls back to
> `<S3_ENDPOINT>/<bucket>/<key>`; Garage returns `403` for those signed URLs in
> browsers. The API logs a warning at startup when this happens. Older rows
> stored with the endpoint form are rewritten to `S3_BASE_URL` by the admin
> media layer when both variables are configured.

`BUCKET_ADMIN_TOKEN` is **not** needed at runtime. It is only for one-time
bucket administration (see below); do not put it in the API service env.

## Making uploaded images publicly readable

Garage S3 requests must be signed, so a private bucket returns `403` to image
clients even when the upload itself succeeded. Garage serves public content
from its **web endpoint** (port 3902), and that endpoint selects a bucket by
matching the request `Host` against a bucket global alias.

The Coolify service exposes the web port at
`web-moo8femylvwkoneyiarpl67b.72.60.35.244.sslip.io`. One-time setup:

```bash
ADMIN=https://admin-moo8femylvwkoneyiarpl67b.72.60.35.244.sslip.io
TOKEN=<BUCKET_ADMIN_TOKEN>
BUCKET_ID=f9d6911c73027dac41dbeb27468c73de357b123a7a241abfb56b6d77151b141d
WEB_HOST=web-moo8femylvwkoneyiarpl67b.72.60.35.244.sslip.io

# Enable website/public access on the bucket
curl -fsS -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"websiteAccess":{"enabled":true,"indexDocument":"index.html"}}' \
  "$ADMIN/v2/UpdateBucket?id=$BUCKET_ID"

# Alias the bucket to the public web host
curl -fsS -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"bucketId\":\"$BUCKET_ID\",\"globalAlias\":\"$WEB_HOST\"}" \
  "$ADMIN/v2/AddBucketAlias"
```

Verify with the admin API:

```bash
curl -fsS -H "Authorization: Bearer $TOKEN" \
  "$ADMIN/v2/GetBucketInfo?globalAlias=masar"
# -> "websiteAccess": true, globalAliases contains the web host
```

If the Garage URL/domain changes, update `S3_ENDPOINT` and `S3_BASE_URL`, then
re-run the alias step with the new web host.

## Verifying uploads

```bash
cd nest-server
node --input-type=module -e "
import {createRequire} from 'node:module';
const require=createRequire(process.cwd()+'/package.json');
const {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand}=require('@aws-sdk/client-s3');
const c=new S3Client({endpoint:process.env.S3_ENDPOINT,region:process.env.S3_REGION,forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}});
const Key='uploads/check-'+Date.now()+'.txt';
await c.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key,Body:'ok',ContentType:'text/plain'}));
console.log('signed read:',(await (await c.send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key}))).Body.transformToString()));
const r=await fetch(process.env.S3_BASE_URL+'/'+Key);console.log('public read:',r.status,await r.text());
await c.send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key}));
"
```

## Rotating keys

Create a new key in Garage and grant it read/write/owner on `masar`, update
`S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` in the API service env, then revoke
the old key. No code change is required.
