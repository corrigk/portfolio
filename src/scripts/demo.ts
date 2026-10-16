const frame = document.getElementById('demo-frame') as HTMLIFrameElement | null;
const loading = document.getElementById('demo-loading');
if (frame && loading) {
  const done = () => loading.setAttribute('data-done', '');
  frame.addEventListener('load', done);
  setTimeout(done, 8000); // never leave the spinner up forever (cross-origin frames can't report errors)
}
