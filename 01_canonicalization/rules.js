/*
*
*	This function receives a brand and applies a series of rules that filter it for further processing
*
*/
function applyRules(brand){
	// Remove (R) (e.g., "SAMSUNG(R)" -> "SAMSUNG")
	brand=brand.replace(/\(R\)/g,'').trim();
	
	// Remove all non-ASCII, non-alphanumeric characters, leaving spaces (e.g., "SAMSUNG, INC." -> "SAMSUNG INC")
	brand=brand.trim().replace(/&#\d+;/g,'').replace(/[^a-zA-Z0-9\s]/g,'').trim();
	
	// Remove all instances of "BRAND INC" and "BRAND LLC" (e.g., "SAMSUNG LLC" -> "SAMSUNG")
	brand=brand.trim().replace(/[^a-zA-Z0-9]?(INC|LLC)[^a-zA-Z0-9]?$/,'');
	
	// Replaces all instances of brands starting with "BY" (e.g., "BY SAMSUNG" -> "SAMSUNG")
	brand=brand.trim().replace(/^BY /,'').trim();
	
	// Removes all instances of "VISIT THE X STORE" (e.g., "VISIT THE SAMSUNG STORE" -> "SAMSUNG")
	const match=brand.match(/^VISIT THE (.+?) STORE$/i);
	if(match && match[1]) brand=match[1];
	
	// Removes all non-ASCII, non-alphanumeric characters, including spaces (e.g., "BLACK DECKER" -> "BLACKDECKER")
	brand=brand.trim().replace(/[^a-zA-Z0-9]/g,'').trim();
	
	// Removes all only numeric brands (e.g., "1241241")
	brand=brand.trim().replace(/^\d+$/g,'').trim();
	
	
	// Removes question mark before brand name (e.g., "?SAMSUNG" -> "SAMSUNG")
	brand=brand.replace(/^\?+/g,'');
	
	// Removes brands beginning with BLU/YEL/ORG/RED/WEB + number (these are label numbers)
	brand=brand.replace(/^(BLU|ORG|RED|YEL|WEB)\d+$/g,'').trim();
	
	return brand;
}

module.exports = { applyRules };