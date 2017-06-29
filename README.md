## aframe-indexedfaceset-geometry

[![Version](http://img.shields.io/npm/v/aframe-indexedfaceset-component.svg?style=flat-square)](https://npmjs.org/package/aframe-indexedfaceset-component)
[![License](http://img.shields.io/npm/l/aframe-indexedfaceset-component.svg?style=flat-square)](https://npmjs.org/package/aframe-indexedfaceset-component)

A indexedfaceset geometry primitive for [A-Frame](https://aframe.io). This component produces a geometry directly constructed from the provided points. It includes optional triangulation and reasonable default texture coordinate calculations for convenient use. The envisioned use case is for geometries which are not compatible with simple geometric primitives but relatively easy to construct. Another use case is procedural geometry.

See also [aframe-faceset-component](https://github.com/andreasplesch/aframe-faceset-component) for a regular component.

This is a custom geometry primitive. All properties are properties of the geometry component.

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| primitive | name | indexedfaceset |
| vertices |  list of point  |  -0.5 0 0.5, 0.5 0 0.5,
| |          x, y, z triplets  |     0.5 0 -0.5, -0.5 0 -0.5   |
| faces | list of faces | empty list|
| |         n indices terminated by -1 |  |
| projectdir | axis along which | auto|
| |          to project for 2d triangulation | |
| uvs |    list of 2d vertex coord.  | empty list |

- faces: each face is defined by at least 3 but potentially any number of indices into the vertices list. Each face is separated from the next face by a '-1' pseudo-index. Each face polygon needs to be convex. If no faces are provided, Delaunay triangulation of the vertices is used. To determine the indices in this case, the vertices are first collapsed into a 2d plane along the axis given by the projectdir property.

- projectdir: one of x, y or z. Other values result in projection along the shortest dimension of the bounding box.

- uvs: the list should contain one 2d coordinate pair for each vertex in the vertices list. If no uvs are provided, uvs are assigned based on the two largest dimensions of the bounding box surrounding the vertices.The u coordinate varies from 0 to 1 along the largest dimension, the v coordinate along the second largest.

There is also a corresponding <a-indexedfaceset> primitive available.

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.5.0/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-triangleset-component/dist/aframe-indexedfaceset-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity geometry="primitive: indexedfaceset"></a-entity>
    <a-indexedfaceset vertices="0 0 -5, 2.5 1 -5, 5 0 -5, 5 5 -5, 2.5 4 -5, 0 5 -5"
                      faces="0 1 4 5 -1, 1 2 3 4 -1"></a-indexedfaceset>
  </a-scene>
</body>
```

<!-- If component is accepted to the Registry, uncomment this. -->
<!--
Or with [angle](https://npmjs.com/package/angle/), you can install the proper
version of the component straight into your HTML file, respective to your
version of A-Frame:

```sh
angle install aframe-indexedfaceset-component
```
-->

#### npm NYI

Install via npm:

```bash
NYI npm install aframe-indexedfaceset-component
```

Then require and use.

```js
require('aframe');
require('aframe-indexedfaceset-component');
```
