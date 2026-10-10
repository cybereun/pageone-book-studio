import JSZip from 'jszip';
export async function readArchive(bytes) {
  if (bytes.byteLength > 100 * 1024 * 1024) throw new Error('100MB 이하의 파일을 가져와 주세요.');
  const zip = await JSZip.loadAsync(bytes);
  const entries = Object.values(zip.files);
  if (entries.length > 10000) throw new Error('파일 항목이 너무 많습니다.');
  let size = 0;
  for (const entry of entries) {
    const path = entry.unsafeOriginalName || entry.name;
    if (path.includes('\\') || /(^|\/)\.\.(\/|$)|^\/|^[a-z]:/i.test(path)) throw new Error('잘못된 압축 경로입니다.');
    size += entry._data?.uncompressedSize || 0;
    if (size > 500 * 1024 * 1024) throw new Error('압축 해제 크기가 500MB를 초과합니다.');
  }
  return zip;
}
