// pages/api/cron.js
// Endpoint: POST /api/cron
// Digunakan oleh Vercel Cron Job untuk trigger GitHub Actions workflow
// Set di vercel.json: cron schedule "0 11 * * 1-5" (11:00 UTC = 18:00 WIB)

export default async function handler(req, res) {
  // Hanya terima POST request
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Please use POST method',
    })
  }

  // Verifikasi CRON_SECRET jika ada (keamanan endpoint)
  // Vercel Cron otomatis set header Authorization jika dikonfigurasi
  const authHeader = req.headers['authorization']
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authorization header',
    })
  }

  // Pastikan env vars tersedia
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const workflowFile = process.env.WORKFLOW_FILE || 'screener.yml'
  const githubToken = process.env.GITHUB_TOKEN_WORKFLOW

  if (!owner || !repo || !githubToken) {
    console.error('Missing required env vars: GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN_WORKFLOW')
    return res.status(500).json({
      error: 'Server misconfiguration',
      message: 'Required environment variables are not set',
    })
  }

  try {
    console.log(`🚀 Triggering GitHub Actions: ${owner}/${repo} → ${workflowFile}`)

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'stock-screener-vercel-cron',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            trigger_source: 'vercel-cron',
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`GitHub API error ${response.status}:`, errorText)
      return res.status(502).json({
        success: false,
        error: `GitHub API returned ${response.status}`,
        detail: errorText,
        timestamp: new Date().toISOString(),
      })
    }

    console.log('✅ GitHub Actions triggered successfully')

    return res.status(200).json({
      success: true,
      message: 'GitHub Actions workflow triggered successfully',
      timestamp: new Date().toISOString(),
      data: {
        owner,
        repo,
        workflow: workflowFile,
        ref: 'main',
      },
    })
  } catch (error) {
    console.error('❌ Cron trigger error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
