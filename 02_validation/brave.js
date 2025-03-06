const fs=require('fs');
const { Builder, By, until } = require('selenium-webdriver');
const cheerio = require('cheerio');
const robot = require('robotjs');
require('dotenv').config();

var timeout=null;
var interval=null;
const targetX=500;
const targetY=300;

var brands=fs.readFileSync('../brands.csv','utf8').split(/[\r\n]+/);
var validated_brands=fs.existsSync('./validated_brands.csv') ? fs.readFileSync('./validated_brands.csv','utf8').split(/[\r\n]+/) : [];

var brandsJSON=fs.existsSync('./brave_brands.json') ? JSON.parse(fs.readFileSync('./brave_brands.json','utf8')) : {}

runValidator();

async function runValidator(){
	let driver=await new Builder().forBrowser('chrome').build();
	try {
		for(let i=0;i<brands.length;i++){
			if(brandsJSON[brands[i]] || validated_brands.indexOf(brands[i])>0) continue;
			console.log(`${i} - ${brands[i]}`);
			timeout=setTimeout(()=>{
				process.stdout.write('\x07');
				robot.mouseClick('left');
				interval=setInterval(()=>{
					process.stdout.write('\x07');
					robot.moveMouse(targetX,targetY);
					robot.mouseClick('left');
				},1000);
			},3000);
			const url='https://search.brave.com/search?q=brand+amazon+'+encodeURIComponent(brands[i]);
			await driver.get(url);
			await driver.wait(until.elementLocated(By.css('#results')),100000);
			clearTimeout(timeout);
			clearInterval(interval);
			// Retrieve the full page source (HTML)
			let pageContent=await driver.getPageSource();
			let results=[];
			let updated=false
			const $=cheerio.load(pageContent);
			
			$('#results .snippet').each((j,elem) =>{
				let title=$(elem).find('.title').first().text().trim();
				let url=$(elem).find('a').attr('href');
				if(url) url=url.trim();
				//const snippet=$(elem).find('.snippet-description.desktop-default-regular').text().trim();
				if(title.length>0 && url.length>0) results.push({t:title,u:url})
			});
			if(results.length>0){
				brandsJSON[brands[i]]=results;
				fs.writeFileSync('./brave_brands.json',JSON.stringify(brandsJSON));
			}
		
			let matches=[];
			for(let j=0;j<results.length;j++){
				results[j].t=results[j].t.toUpperCase();
				if(results[j].t==brands[i]+' - POSHMARK' || results[j].t==brands[i]+' : TARGET' || results[j].t=='AMAZON.COM: : '+brands[i] || results[j].t=='AMAZON.COM: '+brands[i] || results[j].t=='WALMART.COM: '+brands[i] || results[j].t=='BRAND: '+brands[i]){
					console.log(`Validated: ${brands[i]}`);
					fs.appendFileSync('./validated_brands.csv',brands[i]+'\n');
					break;
				}
				
				let replaced=brands[i].replace(/[^a-zA-Z0-9]/g,'');
				matches=results[j].u.match(/"https:\/\/www.amazon.com\/stores\/([^\/]+)[^"]+"/);
				if(!matches || matches.length==0) continue;
				if(matches[1].toUpperCase().replace(/[^a-zA-Z0-9]/g,'')==replaced){
					console.log(`Validated: ${brands[i]}`);
					fs.appendFileSync('./validated_brands.csv',brands[i]+'\n');
					break;
				}
				matches=results[j].u.match(/"https:\/\/www.walmart.com\/cp\/([^\/]+)[^"]+"/);
				if(matches[1].toUpperCase().replace(/[^a-zA-Z0-9]/g,'')==replaced){
					console.log(`Validated: ${brands[i]}`);
					fs.appendFileSync('./validated_brands.csv',brands[i]+'\n');
					break;
				}
				matches=results[j].u.match(/"https:\/\/www.walmart.com\/brand\/([^\/]+)[^"]+"/);
				if(matches[1].toUpperCase().replace(/[^a-zA-Z0-9]/g,'')==replaced){
					console.log(`Validated: ${brands[i]}`);
					fs.appendFileSync('./validated_brands.csv',brands[i]+'\n');
					break;
				}
				matches=results[j].u.match(/"https:\/\/www.homedepot.com\/b\/([^\/]+)[^"]+"/);
				if(matches[1].toUpperCase().replace(/[^a-zA-Z0-9]/g,'')==replaced){
					console.log(`Validated: ${brands[i]}`);
					fs.appendFileSync('./validated_brands.csv',brands[i]+'\n');
					break;
				}
			}
			await wait(2000);
		}
	}catch (error) {
		console.error('Error fetching page content:', error);
	} finally {
		// Close the browser
		await driver.quit();
	}
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}