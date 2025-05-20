/* BEGIN SETTINGS */
const SIMILARITY_THRESHOLD=0.9; // Adjust this to expected similarity
const FILE_RULES='../01_canonicalization/rules.js'; // Location of file containing the rules (input)
const FILE_CANONICAL='../01_canonicalization/brands_canonical.json';  // Location of file containing the canonical brands (input)
const FILE_SIMILAR_TWOWAY='./similar_twoway.csv'; // Location of file containing one-way similar strings (output)
const FILE_SIMILAR_ONEWAY='./similar_oneway.csv'; // Location of file containing two-way similar strings (output) 
/* END SETTINGS */

const fs=require('fs');
const {applyRules}=require(FILE_RULES); // Load the applyRules function from rules.js


// Convert brands into array and make sure it contains unique values
var brands=JSON.parse(fs.readFileSync(FILE_CANONICAL,'utf8'));
var brands_keys=Object.keys(brands);
console.log(`${brands_keys.length} unique canonical brands found.`);

// Checks if brands have been processed already
var processed=[]
if(fs.existsSync(FILE_SIMILAR_TWOWAY,'')){
	let lines=fs.readFileSync(FILE_SIMILAR_TWOWAY,'utf8').split(/[\r\n]+/);
	for(let i=0;i<lines.length;i++){
		lines[i]=lines[i].split(/\t/g);
		if(lines[i][0].length>0) processed.push(lines[i][0]);
	}
	processed=[...new Set(processed)]; // Make sure the array contains unique values
}
console.log(`${processed.length} brands processed (${(processed.length/brands.length).toFixed(4)}%).`);


// Compute similarity for each unique pair
for(let i=0;i<brands_keys.length;i++){
	if(processed.indexOf(brands_keys[i])>-1) continue;
	let similar=[] // Create an array to store similarity scores 
	let similar_oneway=[] // Create an array to store similarity scores 
	console.log(`Processing ${i+1} - ${brands_keys[i]} (${((i+1)/brands_keys.length).toFixed(4)}%)`);
	for(let j=i+1;j<brands_keys.length;j++){
		if(i==j) continue; // Avoid comparing the same brand
		if(brands_keys[i]==brands_keys[j]){ // The strings are the same
			similar.push(`${brands_keys[i]}\t${brands_keys[j]}\t1.0`);
			similar.push(`${brands_keys[j]}\t${brands_keys[i]}\t1.0`);
			similar_oneway.push(`${brands_keys[i]}\t${brands_keys[j]}\t1.0`);
		}else{
			// Compare strings using Jaro Winkler
			let similarity_score=jaroWinkler(brands_keys[i],brands_keys[j]);
			if(similarity_score>SIMILARITY_THRESHOLD){
				similar.push(`${brands_keys[i]}\t${brands_keys[j]}\t${similarity_score.toFixed(2)}`);
				similar.push(`${brands_keys[j]}\t${brands_keys[i]}\t${similarity_score.toFixed(2)}`);
				similar_oneway.push(`${brands_keys[i]}\t${brands_keys[j]}\t${similarity_score.toFixed(2)}`);
			}
		}
	}
	// Log and save files
	if(similar.length>0){
		//process.stdout.write(similar.join('\n')+'\n')
		fs.appendFileSync(FILE_SIMILAR_TWOWAY,similar.join('\n')+'\n');
	}
	if(similar_oneway.length>0){
		fs.appendFileSync(FILE_SIMILAR_ONEWAY,similar_oneway.join('\n')+'\n');
	}
}

/* SIMILARITY FUNCTIONS */

// Jaro-Winkler similarity extends Jaro by giving extra weight to common prefixes.
function jaroWinkler(s1,s2){
	const jaroDist=jaro(s1,s2);
	let prefix=0;
	const maxPrefix=4; // Maximum prefix length to use.
	for(let i=0;i<Math.min(maxPrefix,s1.length,s2.length);i++){
		if(s1[i]===s2[i]) prefix++;
		else break;
	}
	const scalingFactor=0.1; // Commonly used scaling factor.
	return jaroDist+prefix*scalingFactor*(1-jaroDist);
}

function jaro(s1,s2){
	if(s1===s2) return 1;
	const len1=s1.length;
	const len2=s2.length;
	if(len1===0 || len2===0) return 0;

	// The matching window is defined as floor(max(len1, len2) / 2) - 1.
	const matchDistance=Math.floor(Math.max(len1,len2)/2)-1;
	const s1Matches=new Array(len1).fill(false);
	const s2Matches=new Array(len2).fill(false);
	let matches=0;
	let transpositions=0;

	// Find matching characters.
	for(let i=0;i<len1;i++){
		const start=Math.max(0,i-matchDistance);
		const end=Math.min(i+matchDistance+1,len2);
		for(let j=start;j<end;j++){
			if(s2Matches[j]) continue;
			if(s1[i]!==s2[j]) continue;
			s1Matches[i]=true;
			s2Matches[j]=true;
			matches++;
			break;
		}
	}

	if(matches===0) return 0;

	// Count transpositions.
	let k=0;
	for(let i=0;i<len1;i++){
		if(!s1Matches[i]) continue;
		while(!s2Matches[k]) k++;
		if(s1[i]!==s2[k]) transpositions++;
		k++;
	}
	transpositions=transpositions/2;
	return ((matches/len1)+(matches/len2)+((matches-transpositions)/matches))/3;
}
