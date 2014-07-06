var keys = [
	"name",
	"color",
	"infos",
	"content",
	"category",
	"images",
	"img",
	"visible",
	"local",
	"availableCategories",
	"sAttributes",
	"transition",
	"duration",
	"fontSize",
	"fontType"
];

function showDownload(jData) {
	var data = "text/json;charset=utf-8," + encodeURIComponent(
		JSON.stringify(jData, keys, 2));

	if($("#download").toArray().length!==0) {
		$("#download").remove();
	}
	$('<a id="download" href="data:' + data + '" download="info_data.json">info_data.json herunterladen</a>').appendTo('#exportContainer');
}

function getLocalImages( data ) {
	var images = [];
	var test = $(data).find("li");
	test.each(function(i, d) {
		var file = $(d).text().replace("\n", "");
		if(file[file.length-1]!=="/") {
		  	var file_parts = file.split('.');
		  	var end = file_parts[file_parts.length-1];
		  	if($.inArray(end, imageFormats) !== -1) {
			  	images.push(file);
		  	}
		}
	});
	return images;
}

function Information(content, initialCategory) {
    var self = this;
    self.content = ko.observable(content);
    self.category = ko.observable(initialCategory);
    // self.category = self.category_();
}

function Category(name, color) {
	var self = this;
	self.name = ko.observable(name);
	self.color = ko.observable(color);
}

function Image(url, local, visible) {
	var self = this;
	self.img = ko.observable(url);
	self.local = local;
	self.visible = ko.observable(visible);
}

// Overall viewmodel for this screen, along with initial state
function InformationsViewModel(localImages, currentData) {
    var self = this;


    self.editInfos = ko.observable(true);
    self.editImages = ko.observable(true);
    self.exportData = ko.observable(false);
    self.json = ko.observable("");

    // Non-editable catalog data - would come from the server
    self.availableCategories = ko.observableArray([]);
    currentData.availableCategories.forEach(function(d) {
    	self.availableCategories.push(new Category(d.name, d.color));
    });

    // Editable data
    self.infos = ko.observableArray([]);
    currentData.infos.forEach(function(d) {
    	self.infos.push(new Information(d.content, self.availableCategories()[parseInt(d.category)]));
    })

    self.addInfo = function() {
        self.infos.push(new Information("", self.availableCategories[0]));
    }

    self.addCategory = function() {
        self.availableCategories.push(new Category("", "#ccc"));
    }

    self.removeInfo = function(info) { self.infos.remove(info) }

    self.removeCategory = function(category) { self.availableCategories.remove(category) }

    self.images = ko.observableArray([]);
    localImages.forEach(function(d) {
    	var visible = false;
    	currentData.images.forEach(function(e) {
    		if(d===e.img && e.visible===true && e.local===true) visible=true;
    	});
    	self.images.push(new Image(d, true, visible));
    });
	currentData.images.forEach(function(e) {
		if(e.local===false) self.images.push(new Image(e.img, false, e.visible));
	});


    self.addImage = function() {
        self.images.push(new Image("", false, false));
    }

    self.removeImage = function(image) { self.images.remove(image) }

    self.save = function() {
    	var jData = JSON.parse(ko.toJSON(viewModel));
    	jData.images = jData.images.filter(function(d) {
    		if(d.local) {
	    		return d.visible;
    		} else {
	    		return d.img !== "";
    		}
    	})
    	jData.infos = jData.infos.filter(function(d) {
    		jData.availableCategories.forEach(function(e, i) {
    			if(e.name===d.category.name) d.category = i;
    		});
    		return d.content !== "";
    	})
    	self.json(JSON.stringify(jData, keys, 0));
    	$("#exportArea").text("");

    	showDownload(jData);
    }

    self.transitions = ["slide", "dissolve"];
    self.times = Array.apply(null, Array(20+1)).map(function (_, i) {return i;});
    self.times = self.times.slice(1, self.times.length);
    self.sizes = Array.apply(null, Array(70+1)).map(function (_, i) {return i;});
    self.sizes = self.sizes.slice(20, self.sizes.length);
    self.fontTypes = [
  //   	'Georgia, serif',
  //   	'"Palatino Linotype", "Book Antiqua", Palatino, serif',
  //   	'"Times New Roman", Times, serif',
  //   	'Arial, Helvetica, sans-serif',
  //   	'"Arial Black", Gadget, sans-serif',
  //   	'"Comic Sans MS", cursive, sans-serif',
		// 'Impact, Charcoal, sans-serif',
		// '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
		// 'Tahoma, Geneva, sans-serif',
		// '"Trebuchet MS", Helvetica, sans-serif',
		// 'Verdana, Geneva, sans-serif',
		// '"Courier New", Courier, monospace',
		// '"Lucida Console", Monaco, monospace'
		"serif", "sans-serif", "monospace"
    ];

    self.sAttributes = {"transition": ko.observable("slide"), "duration": ko.observable(5), "fontSize": ko.observable(24), "fontType": ko.observable("sans-serif")};

    return self;
}

ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function(element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.unwrap(value) ? $(element).fadeIn() : $(element).fadeOut();
    }
};

function renderEditor(localImages, currentData) {

	viewModel = new InformationsViewModel(localImages, currentData);
	ko.applyBindings(viewModel);
	// var jsonData = ko.toJSON(viewModel, null, 2);
	$("#mainContainer").fadeTo(3000, 1);
}

// MAIN Processing
var imageFormats = ["jpg", "jpeg", "gif", "bmp"],
	viewModel;

$.get( "/", function(data) {
	$.getJSON( "info_data.json", function( currentData ) {
		var localImages = getLocalImages(data);
		renderEditor(localImages, currentData);
	});
});