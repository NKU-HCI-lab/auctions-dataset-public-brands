const fs=require('fs');
const SIMILARITY_THRESHOLD=0.9; // Adjust this to expected similarity

// Convert brands into array
const brands=fs.readFileSync('../brands.csv','utf8').split(/[\r\n]+/);

// Prepare files
fs.writeFileSync('./same_string.csv','');
fs.writeFileSync('./jaro_winkler.csv','');

let found=[]
// Compute similarity for each unique pair
for(let i=0;i<brands.length;i++){
	let same_string=[]
	let jaro_winkler=[]
	let processed=[]
	let w1=applyRules(brands[i].trim()).replace(/[^a-zA-Z0-9]+/g,'')
	if(found.indexOf(w1)>0) continue
	for(let j=i+1;j<brands.length;j++){
		const w2=applyRules(brands[j].trim())
		if(w1==w2){
			//console.log(`Same string: ${brands[i]},${brands[j]}`)
			//same_string.push(brands[j])
			if(found.indexOf(w1)<0) found.push(w1)
			jaro_winkler.push(`${brands[i]}\t${brands[j]}\t1.0`)
		}else{
			let similarity=jaroWinkler(w1,w2)
			if(similarity>SIMILARITY_THRESHOLD){
				console.log(`Jaro Winkler: ${brands[i]},${brands[j]} - ${similarity.toFixed(2)}`)
				jaro_winkler.push(`${brands[i]}\t${brands[j]}\t${similarity.toFixed(2)}`)
			}
		}
	}
	//if(same_string.length>0) fs.appendFileSync('./same_string.csv',`${brands[i]}\t`+same_string.join('\t')+'\n')
	if(jaro_winkler.length>0) fs.appendFileSync('./jaro_winkler.csv',jaro_winkler.join('\n')+'\n')
}


function applyRules(brand){
	brand=brand.trim()
	// 1. "VISIT THE X STORE" Same format
	const match=brand.match(/^VISIT\s+THE\s+(.+?)\s+STORE$/i);
	if(match) return match[1];
	// 2. "?BRAND" Question mark before brand name
	brand=brand.replace(/^\?+/g,'')
	return brand;
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
