const gkm=require('gkm');
const robot=require('robotjs');

gkm.events.on('mouse',(data)=>{
	if(data[0]==='mousemove') console.log(`Mouse moved to: (${data[1]}, ${data[2]})`);
});

/*
// Define the target coordinates to move the mouse to
const targetX = 500;
const targetY = 300;

// Wait 5 seconds then reposition the mouse using robotjs
setTimeout(() => {
  console.log(`Moving mouse to: (${targetX}, ${targetY})`);
  robot.moveMouse(targetX, targetY);
}, 5000);
*/