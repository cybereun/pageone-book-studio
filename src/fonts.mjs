export const fonts = {
  serif: ['부크크명조','BookkMyungjo_Light.ttf','BookkMyungjo_Bold.ttf'],
  sans: ['부크크고딕','BookkGothic_Light.ttf','BookkGothic_Bold.ttf'],
  nanumSerif: ['나눔명조','NanumMyeongjo.ttf','NanumMyeongjoBold.ttf'],
  nanumSans: ['나눔고딕','NanumGothic-Regular.ttf','NanumGothic-Bold.ttf'],
  barun: ['나눔바른고딕','NanumBarunGothic.ttf','NanumBarunGothicBold.ttf'],
  square: ['나눔스퀘어','NanumSquareR.ttf','NanumSquareB.ttf'],
  round: ['나눔스퀘어라운드','NanumSquareRoundR.ttf','NanumSquareRoundB.ttf'],
  neo: ['나눔스퀘어네오','NanumSquareNeo-bRg.ttf','NanumSquareNeo-cBd.ttf'],
  human: ['나눔휴먼','NanumHumanRegular.ttf','NanumHumanBold.ttf'],
  pen: ['나눔손글씨 펜','NanumPen.ttf','NanumPen.ttf'],
  brush: ['나눔손글씨 붓','NanumBrush.ttf','NanumBrush.ttf'],
  barunpen: ['나눔바른펜','NanumBarunpenR.ttf','NanumBarunpenB.ttf'],
  gothicEco: ['나눔고딕 에코','NanumGothicEco.ttf','NanumGothicEcoBold.ttf'],
  myeongjoEco: ['나눔명조 에코','NanumMyeongjoEco.ttf','NanumMyeongjoEcoBold.ttf'],
  oldSerif: ['나눔명조 옛한글','NanumMyeongjo-YetHangul.ttf','NanumMyeongjo-YetHangul.ttf'],
  oldSans: ['나눔바른고딕 옛한글','NanumBarunGothic-YetHangul.ttf','NanumBarunGothic-YetHangul.ttf'],
  coding: ['D2Coding','D2Coding-Ver1.3.2-20180524-ligature.ttf','D2CodingBold-Ver1.3.2-20180524-ligature.ttf'],
};
export function bookFonts(book) {
  const body=fonts[book.print.font]||fonts.serif,heading=fonts[book.print.headingFont]||fonts.sans;
  return [[body[1],'BookSerif',400],[body[2],'BookSerif',700],[heading[1],'BookSans',400],[heading[2],'BookSans',700]];
}
export const fontFaces=(book,base)=>bookFonts(book).map(([file,family,weight])=>`@font-face{font-family:${family};font-weight:${weight};src:url('${base}${file}');}`).join('');
