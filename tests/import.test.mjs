import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { importManuscript } from '../src/import.mjs';
import { cleanHtml } from '../src/html.mjs';
const bytes = text => new TextEncoder().encode(text);
test('UTF8 manuscript imports as editable paragraphs', async () => {
  const r = await importManuscript(bytes('첫 문장\n\n두 번째 문장'), '원고.txt');
  assert.match(r.chapters[0].html, /<p>첫 문장<\/p>/);
  assert.match(r.chapters[0].html, /두 번째 문장/);
});
test('IDML reads named stories and reports layout differences', async () => {
  const zip = new JSZip();
  zip.file('designmap.xml', '<Document><idPkg:Story src="Stories/Story_u1.xml"/></Document>');
  zip.file('Stories/Story_u1.xml', '<idPkg:Story><Story><ParagraphStyleRange><CharacterStyleRange><Content>인디자인 원고</Content></CharacterStyleRange></ParagraphStyleRange></Story></idPkg:Story>');
  const r = await importManuscript(await zip.generateAsync({type:'uint8array'}), '원고.idml');
  assert.match(r.chapters[0].html, /인디자인 원고/);
  assert.ok(r.warnings.length);
});
test('HWPX namespace paragraphs preserve Korean text', async () => {
  const zip = new JSZip();
  zip.file('Contents/section0.xml', '<hs:sec><hp:p><hp:run><hp:t>한글 원고</hp:t></hp:run></hp:p></hs:sec>');
  const r = await importManuscript(await zip.generateAsync({type:'uint8array'}), '원고.hwpx');
  assert.match(r.chapters[0].html, /한글 원고/);
});
test('HWPX preserves bold text, table structure and embedded images', async () => {
  const zip=new JSZip();
  zip.file('Contents/header.xml','<head><charProperties><charPr id="1"><bold/></charPr></charProperties></head>');
  zip.file('Contents/content.hpf','<package><manifest><item id="img1" href="BinData/pic.png" media-type="image/png"/></manifest></package>');
  zip.file('BinData/pic.png',new Uint8Array([137,80,78,71]));
  zip.file('Contents/section0.xml','<hs:sec><hp:p><hp:run charPrIDRef="1"><hp:t>강조 문장</hp:t></hp:run></hp:p><hp:p><hp:run><hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>표 내용</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl><hp:pic><hc:img binaryItemIDRef="img1"/></hp:pic></hp:run></hp:p></hs:sec>');
  const r=await importManuscript(await zip.generateAsync({type:'uint8array'}),'그림.hwpx');
  assert.match(r.chapters[0].html,/<strong>강조 문장<\/strong>/);
  assert.match(r.chapters[0].html,/<table>/);
  assert.match(r.chapters[0].html,/data:image\/png;base64/);
  assert.equal((r.chapters[0].html.match(/표 내용/g)||[]).length,1);
});
test('native INDD and HWP are not falsely accepted', async () => {
  await assert.rejects(importManuscript(bytes('x'), '원고.indd'), /IDML/);
  await assert.rejects(importManuscript(bytes('x'), '원고.hwp'), /HWPX/);
});
test('sanitizer removes execution, external image requests and unsafe URLs', () => {
  const html = cleanHtml('<p onclick="x()">책<script>bad()</script><img src="https://evil.test/a"><a href="javascript:alert(1)">링크</a></p>');
  assert.doesNotMatch(html, /onclick|script|evil|javascript/);
  assert.match(html, /책/);
});

test('pasted div paragraphs preserve line boundaries',()=>{assert.equal(cleanHtml('첫 줄<div>둘째 줄</div><div>셋째 줄</div>'),'첫 줄<p>둘째 줄</p><p>셋째 줄</p>');});
