export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import('../../api-server/app');
    return app(req, res);
  } catch (error: any) {
    console.error('[API Catchall Critical Error]:', error);
    res.status(500).json({
      status: 'error',
      message: `Critical startup error: ${error.message || String(error)}`,
      error: error.message || String(error),
      stack: error.stack || null,
    });
  }
}
