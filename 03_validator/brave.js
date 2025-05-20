/* BEGIN SETTINGS */
const FILE_RULES='../01_canonicalization/rules.js'; // Location of file containing the rules (input)
const FILE_CANONICAL='../01_canonicalization/brands_canonical.json';  // Location of file containing the canonical brands (input)
const FILE_VALIDATED='./validator_validated.csv';  // Location of file containing the validated brands (output)
const FILE_VALIDATED_CANONICAL='./validator_validated_canonical.csv';  // Location of file containing the validated brands (output)
const FILE_PROCESSED='./validator_processed.csv';  // Location of file containing the processed brands (output)
const FILE_PROCESSED_CANONICAL='./validator_processed_canonical.csv';  // Location of file containing the processed brands (output)
const FIND_ALL_BRANDS_WITHIN_CANONICAL=false; // Search for all brands within a single canonical
const FOLDER_RESULTS='./results'; // Location of folder containing the search results
const FOLDER_BACKUP='./backup'; // Location of folder containing the search results
const COORDINATE_CAPTCHA_X=655; // Coordinates of the "I am a human" button
const COORDINATE_CAPTCHA_Y=272; // Coordinates of the "I am a human" button
const START_INDEX_CANONICAL=0; // index to start from
/* END SETTINGS */

const fs=require('fs');
const {Builder,By,until}=require('selenium-webdriver');
const cheerio=require('cheerio');
const robot=require('robotjs');
const {applyRules}=require(FILE_RULES); // Load the applyRules function from rules.js

// Create backups
console.log('Creating backups');
if(!fs.existsSync(FOLDER_BACKUP)) fs.mkdirSync(FOLDER_BACKUP);
if(fs.existsSync(FILE_VALIDATED)) fs.copyFileSync(FILE_VALIDATED,`${FOLDER_BACKUP}/${FILE_VALIDATED.replace('./','')}`);
if(fs.existsSync(FILE_VALIDATED_CANONICAL)) fs.copyFileSync(FILE_VALIDATED_CANONICAL,`${FOLDER_BACKUP}/${FILE_VALIDATED_CANONICAL.replace('./','')}`);
if(fs.existsSync(FILE_PROCESSED)) fs.copyFileSync(FILE_PROCESSED,`${FOLDER_BACKUP}/${FILE_PROCESSED.replace('./','')}`);
if(fs.existsSync(FILE_PROCESSED_CANONICAL)) fs.copyFileSync(FILE_PROCESSED_CANONICAL,`${FOLDER_BACKUP}/${FILE_PROCESSED_CANONICAL.replace('./','')}`);

// Browser automation timeouts
var captchaTimeout=null; // Timeout for the "I am a human" button
var captchaClickInterval=null;
var shutdownTimeout=null;

// JavaScript object that stores the search results (a new file is created at every execution)
var brave_searchResults_JSON={};
const searchResultsTimestamp=new Date().getTime(); // Timestamp for storing the file
const FILE_SEARCH_RESULTS=`./${FOLDER_RESULTS}/${searchResultsTimestamp}_${Math.floor(Math.random()*(99999999-11111111 + 1))+11111111}.json`;

// Create the folder for storing the results
if(!fs.existsSync(FOLDER_RESULTS)) fs.mkdirSync(FOLDER_RESULTS);

// Load brands as a unique array
const brands_canonical=JSON.parse(fs.readFileSync(FILE_CANONICAL,'utf8'));
const brands_canonical_keys=Object.keys(brands_canonical);
console.log(`${brands_canonical_keys.length} canonical brands found. Calculating brands to be processed (this might take a while).`);

// Load brands that have been already validated
var validated_brands=fs.existsSync(FILE_VALIDATED) ? [...new Set(fs.readFileSync(FILE_VALIDATED,'utf8').split(/[\r\n]+/))] : [];
var validated_brands_canonical=fs.existsSync(FILE_VALIDATED_CANONICAL) ? [...new Set(fs.readFileSync(FILE_VALIDATED_CANONICAL,'utf8').split(/[\r\n]+/))] : [];

// Load brands that have been already processed
var processed_brands=fs.existsSync(FILE_PROCESSED) ? fs.readFileSync(FILE_PROCESSED,'utf8').split(/[\r\n]+/) : [];
var processed_brands_canonical=fs.existsSync(FILE_PROCESSED_CANONICAL) ? fs.readFileSync(FILE_PROCESSED_CANONICAL,'utf8').split(/[\r\n]+/) : [];

// Add validated to processed
processed_brands=[...new Set(processed_brands.concat(validated_brands))];
processed_brands_canonical=[...new Set(processed_brands.concat(validated_brands_canonical))];

//let brands_canonical_keys_to_be_processed=brands_canonical_keys.filter(value =>!processed_brands_canonical.includes(value));

console.log(`${processed_brands_canonical.length} brands processed (${(processed_brands_canonical.length/brands_canonical_keys.length).toFixed(4)}%).`);
//console.log(`${brands_canonical_keys_to_be_processed.length} brands to be processed (${(brands_canonical_keys_to_be_processed.length/brands_canonical_keys.length).toFixed(4)}%).`);

var driver;

runValidator();

// Stops processing for X milliseconds
function wait(ms){
	return new Promise(resolve=>setTimeout(resolve,ms));
}

// Main browser automation function
async function runValidator(){
	// Create a new instance of the browser
	driver=await new Builder().forBrowser('chrome').build();
	
	// loop through canonical brands
	for(let i=0;i<brands_canonical_keys.length;i++){
		let brand_canonical=brands_canonical_keys[i]; // Canonical brand currently under observation
		
		// Do not process the brand if it has been processed already
		if(processed_brands_canonical.indexOf(brand_canonical)>-1){
			//process.stdout.write(': already processed.\n');
			continue;
		}
		let result=await searchBrandCanonical(brand_canonical);
	}
	await driver.quit();
}

// Process canonical brand
async function searchBrandCanonical(brand_canonical){
	let canonical_found=false;
	// Process each of the brands within the canonical group
	for(let i=0;i<brands_canonical[brand_canonical].length;i++){
		let brand=brands_canonical[brand_canonical][i]; // Brand currently under observation
		
		
		// Do not process the brand if it has been processed already
		if(processed_brands.indexOf(brand)>-1) continue;
		
		process.stdout.write(`Processing ${brands_canonical_keys.indexOf(brand_canonical)} - ${brand_canonical} (${((brands_canonical_keys.indexOf(brand_canonical))/brands_canonical_keys.length).toFixed(4)}%)`);
		process.stdout.write('\n');
		
		let pageContent=await searchBrand(brand,brand_canonical);
		
		
		// Process and save the results 
		let results=processResults(brand_canonical,brand,pageContent);
		
		// brand not found, try next brand within canonical
		if(results>0){
			console.log(`${brand}(${brand_canonical}) validated.\n`);
			canonical_found=true;
			if(results==2) fs.appendFileSync(FILE_VALIDATED,brand+'\n');
			if(FIND_ALL_BRANDS_WITHIN_CANONICAL) continue;
			else break;
		}
	}
	if(canonical_found) fs.appendFileSync(FILE_VALIDATED_CANONICAL,brand_canonical+'\n');
}

async function searchBrand(brand,brand_canonical){
	try{
		await wait(2000); // Wait before loading 
		// Load URL
		const url='https://search.brave.com/search?q=brand+amazon+'+encodeURIComponent(brand);
		await driver.get(url);
		setCaptchaTimeout(); // Take care of the "I am a human" captcha
		
		// Add brands to processed brands
		processed_brands_canonical.push(brand_canonical);
		fs.appendFileSync(FILE_PROCESSED_CANONICAL,brand_canonical+'\n');
		
		processed_brands.push(brand);
		fs.appendFileSync(FILE_PROCESSED,brand+'\n');
		
		// Prevent the browser from crashing without handling 
		shutdownGracefully();
		
		// Find the query results
		await driver.wait(until.elementLocated(By.css('#results')),1000000);
		
		// The results were loaded, stop the timers
		clearTimeout(captchaTimeout);
		clearInterval(captchaClickInterval);
		
		// Retrieve the full page source (HTML)
		let pageContent=await driver.getPageSource();
				
		return pageContent;
	}catch (error) {
		console.error('Error fetching page content:', error);
		await driver.quit();
		process.exit();
	}
}

function processResults(brand_canonical,brand,pageContent){
	// Handle CSS selectors
	const $=cheerio.load(pageContent);
	
	// Handle results
	let results=[];
	$('#results .snippet').each((j,elem) =>{
		let title=$(elem).find('.title').first().text().trim();
		let url=$(elem).find('a').attr('href');
		if(url) url=url.trim();
		const snippet=$(elem).find('.snippet-description.desktop-default-regular').text().trim();
		if(title.length>0 && url.length>0) results.push({t:title,u:url,s:snippet})
	});
	if(results.length==0) return 0; // No results

	// Store the results
	brave_searchResults_JSON[brand]=results;
	fs.writeFileSync(FILE_SEARCH_RESULTS,JSON.stringify(brave_searchResults_JSON));

	for(let i=0;i<results.length;i++){
		results[i].t=results[i].t.toUpperCase();
		
		// Check if the brand appears as is on Amazon, Poshmark, Target, Walmart
		if(results[i].t==brand+' - POSHMARK' || results[i].t==brand+' : TARGET' || results[i].t=='AMAZON.COM: : '+brand || results[i].t=='AMAZON.COM: '+brand || results[i].t=='WALMART.COM: '+brand || results[i].t=='BRAND: '+brand){
			return 2; // The brand name was found
		}
	}
	for(let i=0;i<results.length;i++){
		let matches=[];
		// Amazon
		matches=results[i].u.match(/"https:\/\/www.amazon.com\/stores\/([^\/]+)[^"]+"/i);
		if(matches && matches[1] && applyRules(matches[1].toUpperCase())==brand_canonical) return 1;
		
		// Walmart
		matches=results[i].u.match(/"https:\/\/www.walmart.com\/cp\/([^\/]+)[^"]+"/i);
		if(matches && matches[1] && applyRules(matches[1].toUpperCase())==brand_canonical) return 1;
		
		matches=results[i].u.match(/"https:\/\/www.walmart.com\/brand\/([^\/]+)[^"]+"/i);
		if(matches && matches[1] && applyRules(matches[1].toUpperCase())==brand_canonical) return 1;
		
		// Home Depot
		matches=results[i].u.match(/"https:\/\/www.homedepot.com\/b\/([^\/]+)[^"]+"/i);
		if(matches && matches[1] && applyRules(matches[1].toUpperCase())==brand_canonical) return 1;
	}
	return -1; // No results after all the checks
}

// Take care of the "I am a human" captcha
function setCaptchaTimeout(){
	clearTimeout(captchaTimeout);
	captchaTimeout=setTimeout(()=>{
		process.stdout.write('\x07'); // beep
		robot.moveMouse(COORDINATE_CAPTCHA_X,COORDINATE_CAPTCHA_Y);
		wait(500);
		robot.mouseClick('left');
		captchaClickInterval=setInterval(()=>{
			process.stdout.write('\x07'); // beep
			robot.moveMouse(COORDINATE_CAPTCHA_X,COORDINATE_CAPTCHA_Y);
			wait(500);
			robot.mouseClick('left');
		},1000);
	},5000);
}

function shutdownGracefully(){
	// Prevent the browser from crashing without handling 
	shutdownTimeout=null;
	shutdownTimeout=setTimeout(async()=>{
		console.log('error - quitting.\n');
		await driver.quit();
		process.exit();
	},300000);
}