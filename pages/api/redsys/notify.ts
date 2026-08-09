import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { createRedsysAPI, SANDBOX_URLS, PRODUCTION_URLS } from 'redsys-easy'
import { fulfillInvoice } from '../../../lib/fulfillment'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature } = req.body
    if (!Ds_MerchantParameters || !Ds_Signature) return res.status(400).send('KO')

    const config = await prisma.redsysConfig.findFirst()
    if (!config) return res.status(500).send('KO')

    const { processRedirectNotification } = createRedsysAPI({
      secretKey: config.secretKey,
      urls: config.environment === 'production' ? PRODUCTION_URLS : SANDBOX_URLS,
    })

    const result = processRedirectNotification({ Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature })
    const responseCode = parseInt(String(result.Ds_Response ?? '9999'))
    if (!(responseCode >= 0 && responseCode <= 99)) return res.status(200).send('OK')

    const redsysOrderId = result.Ds_Order as string
    const invoice = await prisma.invoice.findUnique({ where: { redsysOrderId } })
    if (!invoice) return res.status(200).send('OK')

    await fulfillInvoice(invoice.id)
    return res.status(200).send('OK')
  } catch (e: any) {
    console.error('Notify error:', e.message)
    return res.status(200).send('OK')
  }
}
