import 'dotenv/config'
import { CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { getBucketName, s3 } from '../modules/photos/storage'

async function main() {
  const bucket = getBucketName()

  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }))
    console.log(`Storage bucket "${bucket}" already exists`)
    return
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }))
    console.log(`Storage bucket "${bucket}" created`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
