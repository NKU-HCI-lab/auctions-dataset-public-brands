const fs=require('fs');
const {applyRules}=require('../rules.js'); // Load the applyRules function from rules.js

const SIMILARITY_THRESHOLD=0.9; // Adjust this to expected similarity

// Convert brands into array and make sure it contains unique values
var brands=[...new Set(fs.readFileSync('../brands.csv','utf8').split(/[\r\n]+/))];

console.log(`${brands.length} unique brands found.`);

// Checks if brands have been processed already
var processed=[]
if(fs.existsSync('./similar.csv','')){
	let lines=fs.readFileSync('./similar.csv','utf8').split(/[\r\n]+/);
	for(let i=0;i<lines.length;i++){
		lines[i]=lines[i].split(/\t/g);
		if(lines[i][0].length>0) processed.push(lines[i][0]);
	}
	processed=[...new Set(processed)]; // Make sure the array contains unique values
}
console.log(`${processed.length} brands processed (${(processed.length/brands.length).toFixed(4)}%).`);


// Compute similarity for each unique pair
for(let i=0;i<brands.length;i++){
	if(processed.indexOf(brands[i])>-1) continue; // Avoid processing a brand if it has already been processed 
	let similar=[] // Create an array to store similarity scores 
	let similar_only_next=[] // Create an array to store similarity scores 
	let brands_i_rules=applyRules(brands[i]) // Apply rules to brand[i]
	console.log(`Processing ${i+1} - ${brands[i]} (${((i+1)/brands.length).toFixed(4)}%)`);
	for(let j=0;j<brands.length;j++){
		if(i==j) continue; // Avoid comparing the same brand
		
		let brands_j_rules=applyRules(brands[j]) // Apply rules to brand[j]
		if(brands_i_rules==brands_j_rules){ // The strings are the same
			similar.push(`${brands[i]}\t${brands[j]}\t1.0`)
			if(j>i) similar_only_next.push(`${brands[i]}\t${brands[j]}\t1.0`)
		}
		else{
			// Compare strings using Jaro Winkler
			let similarity_score=jaroWinkler(brands_i_rules,brands_j_rules)
			if(similarity_score>SIMILARITY_THRESHOLD){
				similar.push(`${brands[i]}\t${brands[j]}\t${similarity_score.toFixed(2)}`)
				if(j>i) similar_only_next.push(`${brands[i]}\t${brands[j]}\t${similarity_score.toFixed(2)}`)
			}
		}
	}
	// Log and save files
	if(similar.length>0){
		process.stdout.write(similar.join('\n')+'\n')
		fs.appendFileSync('./similar.csv',similar.join('\n')+'\n')
	}
	if(similar_only_next.length>0){
		fs.appendFileSync('./similar_only_next.csv',similar_only_next.join('\n')+'\n')
	}
}

/* WORD SIMILARITY FUNCTIONS */

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
