<script>

// load FilePond resources
var resources = [
    'filepond.css',
    'filepond.js',
    'filepond-plugin-file-encode.min.js',
    'filepond-plugin-file-validate-type.min.js',
    'filepond-plugin-file-validate-size.min.js',
    'filepond-plugin-image-exif-orientation.min.js',
    'filepond-plugin-image-preview.min.css',
    'filepond-plugin-image-preview.min.js',
    'filepond-plugin-image-crop.min.js',
    'filepond-plugin-image-resize.min.js',
    'filepond-plugin-image-transform.min.js',
    'filepond-plugin-image-edit.min.css',
    'filepond-plugin-image-edit.min.js'
].map(function(resource) { return './static/assets/' + resource + '?1588332424238' });

// expose on global scope for demo purposes
window.pond = null;

loadResources(resources).then(function() {

    // register plugins
    FilePond.registerPlugin(
        FilePondPluginFileEncode,
        FilePondPluginFileValidateType,
        FilePondPluginFileValidateSize,
        FilePondPluginImageExifOrientation,
        FilePondPluginImagePreview,
        FilePondPluginImageCrop,
        FilePondPluginImageResize,
        FilePondPluginImageTransform,
        FilePondPluginImageEdit
    );

    // override default options
    FilePond.setOptions({
        dropOnPage: true,
        dropOnElement: true
    });

    // create splash file pond element
    var fields = [].slice.call(document.querySelectorAll('input[type="file"]'));
    var ponds = fields.map(function(field, index) {
        return FilePond.create(field, {
            server: './api/'
        });
    });

    // add warning to multiple files pond
    var pondDemoMultiple = ponds[1];
    var pondMultipleTimeout;
    pondDemoMultiple.onwarning = function() {
        var container = pondDemoMultiple.element.parentNode;
        var error = container.querySelector('p.filepond--warning');
        if (!error) {
            error = document.createElement('p');
            error.className = 'filepond--warning';
            error.textContent = 'The maximum number of files is 3';
            container.appendChild(error);
        }
        requestAnimationFrame(function() {
            error.dataset.state = 'visible';
        });
        clearTimeout(pondMultipleTimeout);
        pondMultipleTimeout = setTimeout(function() {
            error.dataset.state = 'hidden';
        }, 5000);
    };
    pondDemoMultiple.onaddfile = function() {
        clearTimeout(pondMultipleTimeout);
        var container = pondDemoMultiple.element.parentNode;
        var error = container.querySelector('p.filepond--warning');
        if (error) {
            error.dataset.state = 'hidden';
        }
    };

    // set top pond
    pond = ponds[0];

    // show top pond
    pond.element.parentNode.style.opacity = 1;
    setTimeout(function(){
        pond.addFile('./static/assets/filepond.js')
    }, 1250);

});




</script>
