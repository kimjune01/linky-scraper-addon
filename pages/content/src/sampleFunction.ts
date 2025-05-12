export function sampleFunction() {
  const domain = window.location.hostname;
  if (domain !== 'www.linkedin.com') {
    return;
  }

  const url = window.location.href;
  console.log(url);
}
