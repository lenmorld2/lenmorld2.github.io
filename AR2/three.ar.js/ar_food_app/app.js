var vrDisplay, vrControls, arView;
var canvas, camera, scene, renderer;
var BOX_DISTANCE = 1.5;
var BOX_SIZE = 0.25;
var BOX_QUANTITY = 6;
var boxesAdded = false;

var isUploaded = false;

/**
 * Use the `getARDisplay()` utility to leverage the WebVR API
 * to see if there are any AR-capable WebVR VRDisplays. Returns
 * a valid display if found. Otherwise, display the unsupported
 * browser message.
 */
THREE.ARUtils.getARDisplay().then(function (display) {
    if (display) {
        vrDisplay = display;
        init();
    } else {
        THREE.ARUtils.displayUnsupportedMessage();
    }
});

function init() {

    /*** simple button ****/
    // Initialize the dat.GUI.
//    var datGUI = new dat.GUI();
//    gui = new GUI();
//    datGUI.add(gui, "markerTypeString", ["AR", "QRCODE"]).onFinishChange(function(value) {
//        if (!vrDisplay) {
//            return;
//        }
//        if (value === "QRCODE") {
//            gui.markerType = vrDisplay.MARKER_TYPE_QRCODE;
//        }
//        else if (value === "AR") {
//            gui.markerType = vrDisplay.MARKER_TYPE_AR;
//        }
//    }).name("Marker type");

    /**********************/

    // Setup the three.js rendering environment
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    canvas = renderer.domElement;
    document.body.appendChild(canvas);
    scene = new THREE.Scene();

    // Creating the ARView, which is the object that handles
    // the rendering of the camera stream behind the three.js
    // scene
    arView = new THREE.ARView(vrDisplay, renderer);

    // The ARPerspectiveCamera is very similar to THREE.PerspectiveCamera,
    // except when using an AR-capable browser, the camera uses
    // the projection matrix provided from the device, so that the
    // perspective camera's depth planes and field of view matches
    // the physical camera on the device.
    camera = new THREE.ARPerspectiveCamera(
        vrDisplay,
        60,
        window.innerWidth / window.innerHeight,
        vrDisplay.depthNear,
        vrDisplay.depthFar
    );

    // VRControls is a utility from three.js that applies the device's
    // orientation/position to the perspective camera, keeping our
    // real world and virtual world in sync.
    vrControls = new THREE.VRControls(camera);

    // Bind our event handlers
    window.addEventListener('resize', onWindowResize, false);

    // Kick off the render loop!
    update();
}

/**
 * The render loop, called once per frame. Handles updating
 * our scene and rendering.
 */
function update() {
    // Clears color from the frame before rendering the camera (arView) or scene.
    renderer.clearColor();

    // Render the device's camera stream on screen first of all.
    // It allows to get the right pose synchronized with the right frame.
    arView.render();

    // Update our camera projection matrix in the event that
    // the near or far planes have updated
    camera.updateProjectionMatrix();

    // Update our perspective camera's positioning
    vrControls.update();

    // If we have not added boxes yet, and we have positional
    // information applied to our camera (it can take a few seconds),
    // and the camera's Y position is not undefined or 0, create boxes
    if (!boxesAdded && !camera.position.y) {
//    addBoxes();           // SUPPRESS THE BOXES FOR NOW
    }

    // Render our three.js virtual scene
    renderer.clearDepth();
    renderer.render(scene, camera);

    if (!isUploaded) {
        analyzeObject(canvas);
    }

    // Kick off the requestAnimationFrame to call this function
    // when a new VRDisplay frame is rendered
    vrDisplay.requestAnimationFrame(update);
}

/**
 * On window resize, update the perspective camera's aspect ratio,
 * and call `updateProjectionMatrix` so that we can get the latest
 * projection matrix provided from the device
 */
function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Once we have position information applied to our camera,
 * create some boxes at the same height as the camera
 */
function addBoxes () {
    // Create some cubes around the origin point
    for (var i = 0; i < BOX_QUANTITY; i++) {
        var angle = Math.PI * 2 * (i / BOX_QUANTITY);
        var geometry = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
        var material = new THREE.MeshNormalMaterial();
        var cube = new THREE.Mesh(geometry, material);
        cube.position.set(Math.cos(angle) * BOX_DISTANCE, camera.position.y - 0.25, Math.sin(angle) * BOX_DISTANCE);
        scene.add(cube);
    }

    // Flip this switch so that we only perform this once
    boxesAdded = true;
}


/******* camera support ********/
function hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

if (hasGetUserMedia()) {
    alert("AR is ready!");
    // Good to go!
} else {
    alert('getUserMedia() is not supported in your browser');
}

/*******************************/

function buttonFunc() {
    isUploaded = false;
}

function analyzeObject(canvasObj) {

    // convert webGL image to base64 representation
    var dataURL = canvasObj.toDataURL();

//        document.getElementById('image_url').innerHTML = dataURL.slice(0,30);
//        document.getElementById('image_url_2').innerHTML = dataURL.slice(dataURL.length - 10);

    // *** CLOUDINARY ***
    // upload to Cloudinary
//        uploadFile(dataURL);

    // **** CLARIFAI ****

    var foodModel = "bd367be194cf45149e75f01d59f77ba7";
    // Clarifai.GENERAL_MODEL

    // initialize with your api key. This will also work in your browser via http://browserify.org/
    const app = new Clarifai.App({
        apiKey: 'bf2c869d10754199bdb948e07ca7ab63'
    });

    var base64img = dataURL.split("base64,")[1];

    // predict the contents of an image by passing in a base64 image
    app.models.predict(
        foodModel,
        {base64: base64img}).then(
        function(response) {
//                console.log(response);
            var results = response.outputs[0].data.concepts;
            var text = "";

            // collect keyword results
            for (index in results) {
                var food_result = results[index].name + "_" + results[index].value;
                text += food_result + "<br/>";
            }

//                var food_result_0 = results[0].name + "_" + results[0].value;
//                console.log(results[0].name + "_" + results[0].value);
//                document.getElementById('image_url_3').innerHTML = food_result_0;

            document.getElementById('image_url_3').innerHTML = text;
        },
        function(err) {
            console.error(err);
            document.getElementById('image_url_3').innerHTML = err;
        }
    );

    // TODO: display nutritional info about analyzed food
    // render in 2d/ 3d

    isUploaded = true;
}
