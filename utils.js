// get a random number in [min, max)
export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

// get a random number from a gaussian distribution on (0, 1)
export function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}