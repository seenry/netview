let loaded = false;
let tree_id = 0;
let overlay = [];
let underlay = [];
let tree = [];

const spread = 0.05;
const k0 = 0.00003; // Attraction
const k1 = 2.5; // Repulsion
const k2 = 0.95; // Drag
const k3 = 0.001; // Friction
const min_v = 1e-5;

class Vertex {
	constructor(id_) {
		this.id = id_;
		let w = width * spread;
		let h = height * spread;
		this.pos = [ Math.random() * w + w/2, Math.random() * h + h/2 ];
		this.v = [ 0, 0 ];
		this.neighbors = [];
		this.highlight = false;
	}
	
	AddNeighbor(neighbor) {
		this.neighbors.push(neighbor);
	}
}

function load() {
	loaded = false;

	overlay = [];
	underlay = [];
	tree = [];

	fetch(`./tree-${tree_id}.json`)
		.then((res) => res.json())
		.then((dat) => {
			for (let i = 0; i < dat.length; i++) {
				let u_ = new Vertex(dat[i].id);
				underlay.push(u_);
				tree.push(u_);
				for (let j = 0; j < dat[i].endpoints.length; j++) {
					let o_ = new Vertex(dat[i].endpoints[j]);
					o_.AddNeighbor(u_);
					u_.AddNeighbor(o_);
					
					overlay.push(o_);
					tree.push(o_);
				}
			}
		
			for (let i = 0; i < dat.length; i++) {
				for (let j = 0; j < dat[i].neighbors.length; j++) {
					let n;
					for (let k = 0; k < underlay.length; k++) {
						if (underlay[k].id == dat[i].neighbors[j]) {
							underlay[i].AddNeighbor(underlay[k]);
							break;
						}
					}
				}
			}
		
			loaded = true;
		});
}

function update() {
	const helper = (l) => {
		l.forEach((e) => {
			let a = [ 0, 0 ];
			e.neighbors.forEach((n) => {
				let dx = n.pos[0] - e.pos[0];
				let dy = n.pos[1] - e.pos[1];
				let theta = Math.atan2(dy, dx);
				let strength = (dx*dx + dy*dy) * k0
				a[0] += strength * Math.cos(theta);
				a[1] += strength * Math.sin(theta);
			});
			
			tree.forEach((n) => {
				let dx = n.pos[0] - e.pos[0];
				let dy = n.pos[1] - e.pos[1];
				let ds = Math.sqrt(dx*dx + dy*dy);
				if (ds > 0) {
					let theta = Math.atan2(dy, dx);
					let strength = k1 / ds;
					a[0] -= strength * Math.cos(theta);
					a[1] -= strength * Math.sin(theta);
				}
			});
			
			/*** Update Velocity ***/
			e.v[0] += a[0];
			e.v[1] += a[1];
			let vel = Math.sqrt(e.v[0]*e.v[0] + e.v[1] * e.v[1]);
			let theta = Math.atan2(e.v[1], e.v[0]);
			vel *= k2;
			vel -= k3;
			if (vel < min_v) {
				vel = 0;
			}
			e.v[0] = vel * Math.cos(theta);
			e.v[1] = vel * Math.sin(theta);
			
			/*** Update Position ***/
			e.pos[0] += e.v[0];
			e.pos[1] += e.v[1];
		});
	}
	
	helper(overlay);
	helper(underlay);
}

function track() {
	let cx = 0;
	let cy = 0;
	tree.forEach((e) => {
		cx += e.pos[0];
		cy += e.pos[1];
	});
	cx /= tree.length;
	cy /= tree.length;
	
	let dx = (width / 2) - cx;
	let dy = (height / 2) - cy;
	
	tree.forEach((e) => {
		e.pos[0] += dx;
		e.pos[1] += dy;
	})
}

function render() {
	background(44, 10, 99);

	const mouse_radius_squared = 25;
	tree.forEach((e) => {
		let dx = e.pos[0] - mouseX;
		let dy = e.pos[1] - mouseY;
		if (dx*dx + dy*dy < mouse_radius_squared) {
			e.highlight = true;
			e.neighbors.forEach((n) => {
				n.highlight = true;
			})
		}
	})
	
	fill(0, 0, 0);
	stroke(0, 0, 0);
	strokeWeight(1);
	underlay.forEach((e) => {
		e.neighbors.forEach((n) => {
			line(e.pos[0], e.pos[1], n.pos[0], n.pos[1]);
		});
	});

	noStroke();
	underlay.forEach((e) => {
		fill(0, 0, 0);
		if (e.highlight) {
			fill(0, 80, 80);
			e.highlight = false;
		}
		circle(e.pos[0], e.pos[1], 10);
	});

	overlay.forEach((e) => {
		fill(0, 0, 100);
		stroke(0, 0, 0);
		if (e.highlight) {
			stroke(0, 80, 80);
			e.highlight = false;
		}
		strokeWeight(3);
		circle(e.pos[0], e.pos[1], 18);
		
		fill(0, 0, 0);
		noStroke();
		text(e.id, e.pos[0], e.pos[1] + 4);
	})
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	colorMode(HSB);
	textSize(12);
	textAlign(CENTER);
	
	load();
}

function draw() {
	if (loaded) {
		update();
		track();
		render();
	}
}

function keyPressed() {
	if (49 <= keyCode && keyCode <= 56) {
		tree_id = keyCode - 49;
		if (loaded) {
			load();
		}
	}
}
