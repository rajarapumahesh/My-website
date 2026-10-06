// Set this to the deployed counter's /api/likes URL to enable shared public likes.
// The endpoint is public; never put secret keys in frontend files.
window.PORTFOLIO_LIKES = Object.freeze({
    endpoint: '',
    // Used only when viewing this site on localhost while Wrangler is running.
    localPreviewEndpoint: 'http://127.0.0.1:8787/api/likes',
});
