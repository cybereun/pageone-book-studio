const fs=require('node:fs/promises');
const crypto=require('node:crypto');
async function atomicSave(filePath,bytes){
  const temporary=filePath+'.'+crypto.randomUUID()+'.tmp';
  try {
    await fs.writeFile(temporary,bytes,{flag:'wx'});
    const handle=await fs.open(temporary,'r+');try{await handle.sync();}finally{await handle.close();}
    try{await fs.copyFile(filePath,filePath+'.bak');}catch(e){if(e.code!=='ENOENT')throw e;}
    await fs.rename(temporary,filePath);
  }finally{await fs.rm(temporary,{force:true});}
}
module.exports={atomicSave};
