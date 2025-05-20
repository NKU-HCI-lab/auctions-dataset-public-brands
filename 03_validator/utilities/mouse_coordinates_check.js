const gkm=require('gkm');
const robot=require('robotjs');

gkm.events.on('mouse',(data)=>{
	if(data[0]==='mousemove') console.log(`Mouse moved to: (${data[1]}, ${data[2]})`);
});