/* global AFRAME */

if (typeof AFRAME === 'undefined') {
	throw new Error('Geometry attempted to register before AFRAME was available.');
}

var Delaunay = require('./lib/delaunay.js');

/**
	* Triangleset component for A-Frame.
	*/
AFRAME.registerGeometry('indexedfaceset', {
	schema: {
	vertices: {
		default: [
		{ x: -0.5, y: 0, z: 0.5 },
		{ x: 0.5, y: 0, z: 0.5 },
		{ x: 0.5, y: 0, z: -0.5 },
		{ x: -0.5, y: 0, z: -0.5 }
		],
		
		// Deserialize vertices in the form of any-separated vec3s: `0 0 0, 1 1 1, 2 0 3`.
		parse: function (value) { return parseVec3s (value) },
		
		// Serialize array of vec3s in case someone does getAttribute('faceset', 'vertices', [...]).
		stringify: function (data) {
		return data.map(AFRAME.utils.coordinates.stringify).join(',');
		}
	},
	
	faces: {
		default: [], //use Delauney
		
		// Deserialize index in the form of any-separated vec3s: `0 0 0 -1, 1 1 1 -1, 2 0 3 -1`.
		parse: function (value) { return parseFace3s (value) } ,
		// Serialize array of vec3s in case someone does getAttribute('faceset', 'faces', [...]).
		stringify: function (data) {
		return data.map (function face2coord(face) {
			return { x:face.a, y: face.b, z: face.c };
		} )
		.map(AFRAME.utils.coordinates.stringify).join('-1 ,');
		}
	},
	
	uvs: { // texture coordinates as list 
		default: [],
		parse: function (value) { return parseVec2s (value) } ,
		stringify: function (data) {
		return data.map( function stringify (data) {
			if (typeof data !== 'object') { return data; }
			return [data.x, data.y].join(' ');
		}).join(',');
		}
	},
	
	projectdir: { // normal along which to project, x, y and z are recognized; otherwise based on bb 
		type: 'string',
		default: 'auto'
	},
	
	//translate: { type: 'vec3' }
	},

	/**
	* Set if component needs multiple instancing.
	*/
	//multiple: false,

	/**
	* Called once when component is attached. Generally for initial setup.
	*/
	init: function (data) {
	//this.geometry = new THREE.Geometry();
	//var mesh = this.el.getOrCreateObject3D('mesh', THREE.Mesh);
	//mesh.geometry = this.geometry;
	//collapse onto which plane
	
	this.dmaps = {
		x: {      //2d x coordinate will be
		x: 'y', //y if x size is smallest
		y: 'x',
		z: 'x'
		},
		y: {
		x: 'z',
		y: 'z',
		z: 'y'
		}
	};
	var g = getGeometry(data, this.dmaps, true);
	
	g.faceVertexUvs[0] = [];
	var fs = g.faces ;
	var _uvs = getUvs( data, g, this.dmaps )
	
	fs.forEach( function assignUVs(f, i) {
		g.faceVertexUvs[0].push( [ _uvs[f.a], _uvs[f.b], _uvs[f.c] ]) ;
	});

	g.uvsNeedUpdate = true;
	g.mergeVertices();
	g.computeFaceNormals();
	g.computeVertexNormals();
	g.verticesNeedUpdate = true; // issue #7179, does not work, will need replace vertices
	this.geometry = g;
	},
	
	/**
	* Called when a component is removed (e.g., via removeAttribute).
	* Generally undoes all modifications to the entity.
	*/
	//remove: function () { },

	/**
	* Called on each scene tick.
	*/
	// tick: function (t) { },

	/**
	* Called when entity pauses.
	* Use to stop or remove any dynamic or background behavior such as events.
	*/
	//pause: function () { },

	/**
	* Called when entity resumes.
	* Use to continue or add any dynamic or background behavior such as events.
	*/
	//play: function () { }
});

function parseVec3s (value) {
	if (typeof value === 'object') {return value} // perhaps also check value.isArray
	var mc = value.match(/([+\-0-9eE\.]+)/g);
var vecs = [];
	var vec = {};
	for (var i=0, n=mc?mc.length:0; i<n; i+=3) {
	vec = new THREE.Vector3(+mc[i+0], +mc[i+1], +mc[i+2]);
	vecs.push( vec );
	}
	return vecs;
}

function parseFace3s (value) {
	if (typeof value === 'object') {return value} // perhaps also check value.isArray
	var mc = value.match(/([+\-0-9eE\.]+)/g);
var arr = mc.reduce(function(r,v) {
	if (v<0) { r.push([]); return r } 
	r[r.length-1].push(v); return r
	}
	, [[]]
);
//skip faces with less than 3 nodes
var filtered = arr.filter(function(v, i, arr){
	var skip = v.length < 3;
	if (skip && i < arr.length-1) {console.warn("ifs: skipping face " + i + ": " + v);}
	return !skip});
	var vecs = [];
	var vec = {};
filtered.forEach(function(poly){
	var i, n=poly.length
	for (i=2; i<n; i++) {
	vecs.push (      
		new THREE.Face3(+poly[0], +poly[i-1], +poly[i])
	)
	}  
} );

	// for (var i=0, n=mc?mc.length:0; i<n; i+=3) {
	//   vec = new THREE.Face3(+mc[i+0], +mc[i+1], +mc[i+2]);
	//   vecs.push( vec );
	// }
	return vecs;
}

function parseVec2s (value) {
	if (typeof value === 'object') {return value} // perhaps also check value.isArray
	var mc = value.match(/([+\-0-9eE\.]+)/g);
	var vecs = [];
	var vec = {};
	for (var i=0, n=mc?mc.length:0; i<n; i+=2) {
	vec = new THREE.Vector2(+mc[i+0], +mc[i+1]);
	vecs.push( vec );
	}
	return vecs;
}

function updateGeometry (g, data) {
	g.vertices.forEach(function applyXYZ (v, i) {
		var d = data.vertices[i];
		g.vertices[i].set(d.x, d.y, d.z);
	});
	g.computeBoundingBox();
}


function getGeometry (data, dmaps, facesNeedUpdate) {
	var geometry = new THREE.Geometry();
	
	geometry.vertices = data.vertices; //perhaps also clone, as faces
	geometry.computeBoundingBox();

	if ( data.faces.length == 0 ) {
	//if no faces triangulate
	//find shortest dimension and ignore it for 2d vertices
	var size = BboxSize(geometry);
	var dir = ProjectionDirection(data, size);
	var xd = dmaps.x[dir];
	var yd = dmaps.y[dir];
	var vertices2d = data.vertices.map (
		function project (vtx) {
		//some very minor fuzzing to avoid identical vertices for triangulation
		//var fuzz = 1/10000; // 1/100000 too small if size around 1
		//var xfuzz = size[xd] * (Math.random() - 0.5) * fuzz;
		//var yfuzz = size[yd] * (Math.random() - 0.5) * fuzz;
		return [ vtx[xd] + 0, vtx[yd] + 0 ]
		}
	);
	//vertices2d: array of arrays [[2, 4], [5, 6]]
	//triangles: flat array of indices [0, 1, 2,   2, 1, 3 ]
	var triangles = Delaunay.triangulate(vertices2d); // look for a more robust algo
	for (var i=0; i < triangles.length; i+=3) {
		geometry.faces.push(
		new THREE.Face3( triangles[i], triangles[i+1], triangles[i+2] )
		);
	}
	return geometry
	}
	
	//if (facesNeedUpdate) { geometry.faces = data.triangles; } ;
//clone to preserve hash for cache, and proper removal
	geometry.faces = data.faces.map (
	function clone(face) {
	return face.clone()
	} );
	
	return geometry
}

function BboxSize (geometry) {
	
	var bb = geometry.boundingBox;
	
	var size = bb.max.clone();
	size.sub(bb.min);
	return size
	
} 

function ProjectionDirection (data, size) {
	
	var dir = data.projectdir.toLowerCase();
	if ( !(dir === 'x' || dir === 'y' || dir === 'z') ) { // auto dir
		dir = 'z';
		if ( (size.x < size.y) && (size.x < size.z) ) { dir = 'x';}
		if ( (size.y < size.x) && (size.y < size.z) ) { dir = 'y';}
		// if size.y < size.x && size.y < size.z {xd='x',yd='z'}
	}
	return dir
}

function getUvs (data, g, dmaps) {
	var uvs = data.uvs ;
	if ( uvs.length > 0 ) {
	var uvsLength = +uvs.length ;
	//fill in missing uvs if any
	for (var i = uvsLength; i < g.vertices.length; i++) {
		uvs.push(uvs[uvsLength].clone) ;
	}
	return uvs
	}
	//else {
	//produce default uvs
	var size = BboxSize(g);
	var dir = ProjectionDirection(data, size);
	var xd = dmaps.x[dir];
	var yd = dmaps.y[dir];
	var vs = g.vertices;
	var bb = g.boundingBox ;
	var xoffset = bb.min[xd];
	var yoffset = bb.min[yd];
	var tmpUvs = [];
	vs.forEach( function computeUV(v) {
		tmpUvs.push( new THREE.Vector2 (
		(v[xd] - xoffset) / size[xd] ,
		(v[yd] - yoffset) / size[yd] 
		));
	});
	
	return tmpUvs 
}

//primitive

var extendDeep = AFRAME.utils.extendDeep;
// The mesh mixin provides common material properties for creating mesh-based primitives.
// This makes the material component a default component and maps all the base material properties.
var meshMixin = AFRAME.primitives.getMeshMixin();
AFRAME.registerPrimitive('a-indexedfaceset', extendDeep({}, meshMixin, {
	// Preset default components. These components and component properties will be attached to the entity out-of-the-box.
	defaultComponents: {
	geometry: {primitive: 'indexedfaceset'}
	},
	// Defined mappings from HTML attributes to component properties (using dots as delimiters).
	// If we set `depth="5"` in HTML, then the primitive will automatically set `geometry="depth: 5"`.
	mappings: {
	vertices: 'geometry.vertices',
	faces: 'geometry.faces',
	uvs: 'geometry.uvs',
	projectdir: 'geometry.projectdir'
	}
}));
