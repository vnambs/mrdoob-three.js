/**
 * @author alteredq / http://alteredqualia.com/
 * @author MPanknin / http://www.redplant.de/
 *
 */


THREE.ShaderDeferred = {

	"clipDepth" : {

		uniforms: { },

		fragmentShader : [

			"varying vec4 clipPos;",

			"void main() {",

				"gl_FragColor = vec4( clipPos.z / clipPos.w, 1.0, 1.0, 1.0 );",

			"}"

		].join("\n"),

		vertexShader : [

			"varying vec4 clipPos;",

			THREE.ShaderChunk[ "morphtarget_pars_vertex" ],

			"void main() {",

				THREE.ShaderChunk[ "morphtarget_vertex" ],
				THREE.ShaderChunk[ "default_vertex" ],

				"clipPos = gl_Position;",

			"}"

		].join("\n")

	},

	"normals" : {

		uniforms: { },

		fragmentShader : [

			"varying vec3 normalView;",

			"void main() {",

				"gl_FragColor = vec4( vec3( normalView * 0.5 + 0.5 ), 1.0 );",

			"}"

		].join("\n"),

		vertexShader : [

			"varying vec3 normalView;",

			THREE.ShaderChunk[ "morphtarget_pars_vertex" ],

			"void main() {",

				THREE.ShaderChunk[ "morphnormal_vertex" ],
				THREE.ShaderChunk[ "morphtarget_vertex" ],
				THREE.ShaderChunk[ "default_vertex" ],

				"vec3 objectNormal;",

				"#if !defined( USE_SKINNING ) && defined( USE_MORPHNORMALS )",

					"objectNormal = morphedNormal;",

				"#endif",

				"#if !defined( USE_SKINNING ) && ! defined( USE_MORPHNORMALS )",

					"objectNormal = normal;",

				"#endif",

				"normalView = normalize( normalMatrix * objectNormal );",

			"}"

		].join("\n")

	},

	"bump" : {

		uniforms: {

			bumpMap: 	  { type: "t", value: null },
			bumpScale:	  { type: "f", value: 1 },
			offsetRepeat: { type: "v4", value: new THREE.Vector4( 0, 0, 1, 1 ) }

		},

		fragmentShader : [

			"#extension GL_OES_standard_derivatives : enable\n",

			"varying vec3 normalView;",
			"varying vec2 vUv;",
			"varying vec3 vViewPosition;",

			"uniform sampler2D bumpMap;",
			"uniform float bumpScale;",

			// Derivative maps - bump mapping unparametrized surfaces by Morten Mikkelsen
			//	http://mmikkelsen3d.blogspot.sk/2011/07/derivative-maps.html

			// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)

			"vec2 dHdxy_fwd() {",

				"vec2 dSTdx = dFdx( vUv );",
				"vec2 dSTdy = dFdy( vUv );",

				"float Hll = bumpScale * texture2D( bumpMap, vUv ).x;",
				"float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;",
				"float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;",

				"return vec2( dBx, dBy );",

			"}",

			"vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {",

				"vec3 vSigmaX = dFdx( surf_pos );",
				"vec3 vSigmaY = dFdy( surf_pos );",
				"vec3 vN = surf_norm;",		// normalized

				"vec3 R1 = cross( vSigmaY, vN );",
				"vec3 R2 = cross( vN, vSigmaX );",

				"float fDet = dot( vSigmaX, R1 );",

				"vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );",
				"return normalize( abs( fDet ) * surf_norm - vGrad );",

			"}",

			"void main() {",

				"vec3 normal = normalize( normalView );",
				"normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );",
				"gl_FragColor = vec4( vec3( normal * 0.5 + 0.5 ), 1.0 );",

			"}"

		].join("\n"),

		vertexShader : [

			"varying vec3 normalView;",
			"varying vec2 vUv;",
			"varying vec3 vViewPosition;",

			"uniform vec4 offsetRepeat;",

			"void main() {",

				"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
				"gl_Position = projectionMatrix * mvPosition;",
				"normalView = normalize( normalMatrix * normal );",
				"vUv = uv * offsetRepeat.zw + offsetRepeat.xy;",
				"vViewPosition = -mvPosition.xyz;",

			"}"

		].join("\n")

	},

	"unlit" : {

		uniforms: {

			samplerDepth: { type: "t", value: null },
			viewWidth:    { type: "f", value: 800 },
			viewHeight:   { type: "f", value: 600 },
			lightColor:   { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) }

		},

		fragmentShader : [

			"varying vec4 clipPos;",
			"uniform sampler2D samplerDepth;",

			"uniform float viewHeight;",
			"uniform float viewWidth;",

			"uniform vec3 lightColor;",

			"void main() {",

				"vec2 texCoord = gl_FragCoord.xy / vec2( viewWidth, viewHeight );",
				"float z = texture2D( samplerDepth, texCoord ).x;",
				"vec4 color = vec4( lightColor, 1.0 );",
				"float depth = clipPos.z / clipPos.w;",
				"if( depth > z && z > 0.0 ) color.w = 0.0;",
				"gl_FragColor = color;",

			"}"

		].join("\n"),

		vertexShader : [

			"varying vec4 clipPos;",

			"void main() {",

				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
				"clipPos = gl_Position;",

			"}"

		].join("\n")

	},

	"composite" : {

		uniforms: {

			samplerLightBuffer: { type: "t", value: null },
			samplerEmitter: 	{ type: "t", value: null }

		},

		fragmentShader : [

			"varying vec2 texCoord;",
			"uniform sampler2D samplerLightBuffer;",
			"uniform sampler2D samplerEmitter;",
			"uniform vec3 lightPos;",

			"void main() {",

				"vec3 color = texture2D( samplerLightBuffer, texCoord ).xyz;",
				"vec3 emitter = texture2D( samplerEmitter, texCoord ).xyz;",

				"if ( emitter != vec3( 0.0 ) ) {",

					"gl_FragColor = vec4( emitter, 1.0 );",

				"} else {",

					"gl_FragColor = vec4( sqrt( color ), 1.0 );",

				"}",

			"}"

		].join("\n"),

		vertexShader : [

			"varying vec2 texCoord;",

			"void main() {",

				"vec4 pos = vec4( sign( position.xy ), 0.0, 1.0 );",
				"texCoord = pos.xy * vec2( 0.5 ) + 0.5;",
				"gl_Position = pos;",

			"}"

		].join("\n")

	},

	"light" : {

		uniforms: {

			samplerLightBuffer: { type: "t", value: null },
			samplerNormals: { type: "t", value: null },
			samplerDepth: 	{ type: "t", value: null },
			samplerColor: 	{ type: "t", value: null },
			matView: 		{ type: "m4", value: new THREE.Matrix4() },
			matProjInverse: { type: "m4", value: new THREE.Matrix4() },
			viewWidth: 		{ type: "f", value: 800 },
			viewHeight: 	{ type: "f", value: 600 },
			lightPos: 		{ type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
			lightColor: 	{ type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
			lightIntensity: { type: "f", value: 1.0 },
			lightRadius: 	{ type: "f", value: 1.0 }

		},

		fragmentShader : [

			"varying vec3 lightView;",
			"varying vec4 clipPos;",

			"uniform sampler2D samplerColor;",
			"uniform sampler2D samplerDepth;",
			"uniform sampler2D samplerNormals;",
			"uniform sampler2D samplerLightBuffer;",

			"uniform float lightRadius;",
			"uniform float lightIntensity;",
			"uniform float viewHeight;",
			"uniform float viewWidth;",

			"uniform vec3 lightColor;",

			"uniform mat4 matProjInverse;",

			"void main() {",

				"vec2 texCoord = gl_FragCoord.xy / vec2( viewWidth, viewHeight );",

				"float z = texture2D( samplerDepth, texCoord ).x;",
				"float lightZ = clipPos.z / clipPos.w;",

				/*
				"if ( z == 0.0 ) {",

					"gl_FragColor = vec4( vec3( 0.0 ), 1.0 );",
					"return;",

				"}",
				*/

				"if ( z == 0.0 || lightZ > z ) discard;",

				"float x = texCoord.x * 2.0 - 1.0;",
				"float y = texCoord.y * 2.0 - 1.0;",

				"vec4 projectedPos = vec4( x, y, z, 1.0 );",

				"vec4 viewPos = matProjInverse * projectedPos;",
				"viewPos.xyz /= viewPos.w;",
				"viewPos.w = 1.0;",

				"vec3 lightDir = lightView - viewPos.xyz;",
				"float dist = length( lightDir );",

				"if ( dist > lightRadius ) discard;",

				"lightDir = normalize( lightDir );",

				"float cutoff = 0.3;",
				"float denom = dist/lightRadius + 1.0;",
				"float attenuation = 1.0 / ( denom * denom );",
				"attenuation = ( attenuation - cutoff ) / ( 1.0 - cutoff );",
				"attenuation = max( attenuation, 0.0 );",
				"attenuation *= attenuation;",

				"vec3 normal = texture2D( samplerNormals, texCoord ).xyz * 2.0 - 1.0;",

				// wrap around lighting

				"float diffuseFull = max( dot( normal, lightDir ), 0.0 );",
				"float diffuseHalf = max( 0.5 + 0.5 * dot( normal, lightDir ), 0.0 );",

				"const vec3 wrapRGB = vec3( 0.6, 0.2, 0.2 );",
				"vec3 diffuse = mix( vec3 ( diffuseFull ), vec3( diffuseHalf ), wrapRGB );",

				// simple lighting

				//"float diffuseFull = max( dot( normal, lightDir ), 0.0 );",
				//"vec3 diffuse = vec3 ( diffuseFull );",

				// specular

				"const float shininess = SHININESS;",
				"const float specularIntensity = SPECULAR_INTENSITY;",

				"vec3 halfVector = normalize( lightDir - normalize( viewPos.xyz ) );",
				"float dotNormalHalf = max( dot( normal, halfVector ), 0.0 );",

				// simple specular

				//"vec3 specular = specularIntensity * max( pow( dotNormalHalf, shininess ), 0.0 ) * diffuse;",

				// physically based specular

				"vec3 specularColor = specularIntensity * vec3( 1.0 );",

				"float specularNormalization = ( shininess + 2.0001 ) / 8.0;",

				"vec3 schlick = specularColor + vec3( 1.0 - specularColor ) * pow( 1.0 - dot( lightDir, halfVector ), 5.0 );",
				"vec3 specular = schlick * max( pow( dotNormalHalf, shininess ), 0.0 ) * diffuse * specularNormalization;",

				// color

				"vec4 albedo = texture2D( samplerColor, texCoord );",

				// combine

				"vec4 color = vec4( 0.0 );",
				"color.xyz = albedo.xyz * lightColor * lightIntensity;",
				"color.w = attenuation;",

				"#ifdef ADDITIVE_SPECULAR",

					"gl_FragColor = color * vec4( diffuse, 1.0 ) + vec4( lightColor * lightIntensity * specular, attenuation );",

				"#else",

					"gl_FragColor = color * vec4( diffuse + specular, 1.0 );",

				"#endif",

			"}"

		].join("\n"),

		vertexShader : [

			"varying vec3 lightView;",
			"varying vec4 clipPos;",
			"uniform vec3 lightPos;",
			"uniform mat4 matView;",

			"void main() { ",

				"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
				"gl_Position = projectionMatrix * mvPosition;",
				"lightView = vec3( matView * vec4( lightPos, 1.0 ) );",
				"clipPos = gl_Position;",

			"}"

		].join("\n")

	}


};
