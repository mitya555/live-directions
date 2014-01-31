// load Google Maps API v3
//google.load("maps", "3", { other_params: "sensor=false" });

// global variables
var	gotoAddress, clearAddress, showDirections,
google_maps_init = function() {
	if (!document.activeElement)
		document.addEventListener("focus", function(evt) {
			if (evt && evt.target)
				document.activeElement = evt.target == document ? null : evt.target;
		}, true);
	// Create InfoWindow handler
	var InfoWindowContentClick = function($content, infoWin) {
		var infoWinClickHandler = function() {
			window.setTimeout(function() {
				infoWin.close();
				infoWin._view_ = false;
			}, 10);
		};
		google.maps.event.clearListeners(infoWin, "domready");
		var infoWinOpenListener = google.maps.event.addListener(infoWin, "domready", function() {
			//google.maps.event.removeListener(infoWinOpenListener);
			$content.parent().parent().children("div")./*rightClick*/click(infoWinClickHandler)
				.find("a").click(function(evt) { evt.stopPropagation(); });
			$content.parent().parent().parent().find(
				"img[src='http://maps.gstatic.com/intl/en_us/mapfiles/iw3.png']")./*rightClick*/click(infoWinClickHandler);
		});
		return $content./*rightClick*/click(infoWinClickHandler)[0];
	};
	// Create Directions Service
	var dirService = new google.maps.DirectionsService(),
	dirDisplay = new google.maps.DirectionsRenderer(),
	// Create Directions container
	//dirWindow = new google.maps.InfoWindow(),
	dirInfoContainer = $("<div class='pane-container dir-container' />").css("opacity", 0.85)[0],
	dirStepInfoWin = new google.maps.InfoWindow(),
	dirStepMarker = new google.maps.Marker(),
	dirStreetViewContainer = $("<div class='dir-step-streetview-container' />")[0],
	dirStreetView = new google.maps.StreetViewPanorama(dirStreetViewContainer, {
		//linksControl: false,
		//navigationControl: false,
		zoomControl: false,
		addressControl: false
	}),
	dirStreetViewService = new google.maps.StreetViewService(),
	set_marker_heading = function(marker, heading, url_prefix, center) {
		var dischead = heading_discrete(heading, 10);
		if (marker._dischead_ == null || marker._dischead_ != dischead) {
			marker.setIcon(new google.maps.MarkerImage(url_prefix + dischead +
				".png", null, null, new google.maps.Point(center, center)));
			marker._dischead_ = dischead;
		}
	};
	dirDisplay.setOptions({
		//suppressMarkers: true,
		suppressInfoWindows: true,
		suppressPolylines: true,
		//infoWindow: dirStepInfoWin,
		panel: dirInfoContainer // dirPanel
	});
	google.maps.event.addListener(dirStepInfoWin, "closeclick", function() {
		if (dirDisplay.state_before_info_win) {
			gmap.setCenter(dirDisplay.state_before_info_win.center);
			gmap.setZoom(dirDisplay.state_before_info_win.zoom);
			dirDisplay.state_before_info_win = null;
		}
		dirStepInfoWin._view_ = false;
		dirStepMarker.setMap(null);
	});
	google.maps.event.addListener(dirStreetView, "position_changed", function() {
		var position = dirStreetView.getPosition();
		dirStepInfoWin.setPosition(position);
		dirStepMarker.setPosition(position);
	});
	google.maps.event.addListener(dirStreetView, "pov_changed", function() {
		set_marker_heading(dirStepMarker, heading_normalize(this.getPov().heading),
			"images/red_arrow/tra", 19);
	});
	// close everything on ESC
	$(document).keydown(function(e) {
		if (e.which == 27) {
			if (dirStepInfoWin._view_)
				dirStepInfoWinClose();
			else if (driveMarker.getMap())
				remove_drive();
			else if (dirDisplay.getMap()) {
				//dirWindow.close();
				remove_route();
			} else if ($addr_select(1).is(":visible")) {
				$addr_select(1).css("display", "none");
				$addr_input_and_buttons($addr_input(1)).css("display", "");
			} else if ($addr_select(0).is(":visible")) {
				$addr_select(0).css("display", "none");
				$addr_input_and_buttons($addr_input(0)).css("display", "");
			} else if (address_marker(1).getMap())
				clear_address(1);
			else if (address_marker(0).getMap())
				clear_address(0);
		}
		else if (e.which == 13) {
			if ($addr_select(1).is(":visible"))
				$addr_select(1).change();
			else if ($addr_select(0).is(":visible"))
				$addr_select(0).change();
			else if (!dirDisplay.getMap() && !driveMarker.getMap()) {
				if (document.activeElement == $addr_input(1)[0])
					gotoAddress(1);
				else if (document.activeElement == $addr_input(0)[0])
					gotoAddress(0);
			}
		}
	});
	// Create Map
	var map_container_width, mapContainerResize = function(init) {
		var threshold_width = /*1000*/800, map_width = $map.width();
		if (map_width == threshold_width)
			map_width = threshold_width + 0.1;
		if (init == "init" || (map_container_width - threshold_width) * (map_width - threshold_width) < 0)
			gmap.setOptions({
				mapTypeControlOptions: {
					//mapTypeIds: [
					//	google.maps.MapTypeId.ROADMAP,
					//	google.maps.MapTypeId.SATELLITE,
					//	google.maps.MapTypeId.HYBRID,
					//	google.maps.MapTypeId.TERRAIN
					//],
					style: map_width > threshold_width ? google.maps.MapTypeControlStyle.HORIZONTAL_BAR : google.maps.MapTypeControlStyle.DROPDOWN_MENU
				}
			});
		map_container_width = map_width;
	},
	$map = $("#map").resize(mapContainerResize),
	gmap = new google.maps.Map($map[0], {
		zoom: 12,
		center: new google.maps.LatLng(38.896377, -77.029266),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		//mapTypeControlOptions: {
		//	style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
		//	mapTypeIds: [
		//		google.maps.MapTypeId.ROADMAP,
		//		google.maps.MapTypeId.SATELLITE,
		//		google.maps.MapTypeId.HYBRID,
		//		google.maps.MapTypeId.TERRAIN
		//	]
		//},
		scaleControl: true
	});
	mapContainerResize("init");
	var zoom_changed = 12, zoom_previous = 12;
	google.maps.event.addListener(gmap, "zoom_changed", function() {
		zoom_previous = zoom_changed;
		zoom_changed = gmap.getZoom();
	});
	// Bind Address input (Directions)
	var loading_gif = $("<img src='images/loading.gif' />")[0],
	loading_show = function() { bottom_left_ctrls(show_ctrl, loading_gif); },
	loading_hide = function() { bottom_left_ctrls(hide_ctrl, loading_gif); },
	address_marker_ = [ new google.maps.Marker(), new google.maps.Marker() ],
	address_marker = function(i_addr) {
		return parseInt(i_addr) == 1 ? address_marker_[1] : address_marker_[0];
	},
	$addr_input = function(i_addr) {
		return parseInt(i_addr) == 1 ? $(":text#address-2") : $(":text#address");
	},
	$addr_select = function(i_addr) {
		return parseInt(i_addr) == 1 ? $("select#select-address-2") : $("select#select-address");
	},
	$addr_input_and_buttons = function($addr_inp) {
		var $cont = $addr_inp.closest("table"); 
		return $addr_inp.add("td#addr-buttons", $cont);		
	},
	set_address_marker = function(i_addr, ll) {
		address_marker(i_addr).setOptions({
			position: ll,
			map: gmap,
			title: $addr_input(i_addr).val(),
			icon: new google.maps.MarkerImage("images/crosshair.png",
				new google.maps.Size(20, 20), new google.maps.Point(0, 0),
				new google.maps.Point(10, 10))
		});
	},
	set_address = function(i_addr, text, ll) {
		$addr_select(i_addr).css("display", "none");
		$addr_input_and_buttons($addr_input(i_addr).val(text)).css("display", "");
		set_address_marker(i_addr, ll);
		$addr_select_empty(i_addr);
	},
	addr_markers = [],
	$addr_select_empty = function(i_addr) {
		for (var j = 0; j < addr_markers.length; j++)
			addr_markers[j].setMap(null);
		addr_markers = [];
		return $addr_select(i_addr).unbind("change").empty();
	},
	clear_address = function(i_addr) {
		address_marker(i_addr).setMap(null);
		$addr_select_empty(i_addr).css("display", "none");
		var $cont = $addr_input(i_addr).closest("table"); 
		$addr_input_and_buttons($addr_input(i_addr).val("")).css("display", "");
	},
	find_address = function(i_addr, func) {
		address_marker(i_addr).setMap(null);
		if ($.trim($addr_input(i_addr).val())) {
			loading_show();
			new geocode().findAddress($addr_input(i_addr).val(),
				function(data) {
					$addr_select_empty(i_addr);
					if (data && data.a) {
						if (data.a[0].conf_level == 100) {
							$addr_input(i_addr).val(data.a[0].name);
							set_address_marker(i_addr, new google.maps.LatLng(data.a[0]./*x*/lat, data.a[0]./*y*/lon));
							loading_hide();
							if (func)
								func();
							return;
						}
						else {
							var reverse = (data.type.toLowerCase() == "reverse"), marker_click = function() {
								set_address(i_addr, this.getTitle().split("\r\n")[0], this.getPosition());
							};
							$addr_select(i_addr).append("<option value=''>SELECT...</option>");
							if (reverse)
								addr_markers.push(new google.maps.Marker({
									map: gmap,
									position: new google.maps.LatLng(data.lat, data.lng),
									title: "(" + data.lat + "," + data.lng + ")",
									icon: new google.maps.MarkerImage("images/crosshair.png",
										new google.maps.Size(20, 20), new google.maps.Point(0, 0),
										new google.maps.Point(10, 10))
								}));
							$.each(data.a, function(i, o) {
								if (o.max_conf_level)
									$addr_select(i_addr).append($("<option value='" + o./*x*/lat + "," + o./*y*/lon + "' />").text(o.name));
								var marker_ = new google.maps.Marker({
									map: gmap,
									position: new google.maps.LatLng(o.lat, o.lon),
									title: o.name + "\r\nConfidence Level: " + o.conf_level + (reverse ? "\r\nDistance: " + o.dist + "m" : "")
								});
								if (!o.max_conf_level)
									marker_.setIcon("images/blue_sprite.png");
								addr_markers.push(marker_);
							});
							$.each(addr_markers, function() {
								google.maps.event.addListener(this, "click", marker_click);
							});
							$addr_select(i_addr).change(addr_select_change_func(i_addr, func)).css("display", "").focus();
							$addr_input_and_buttons($addr_input(i_addr)).css("display", "none");
						}
					}
					else
						alert("Invalid address entry.");
					loading_hide();
				},
				function() {
					alert("Address service unavailable.");
					loading_hide();
				});
		}
		else
			$addr_input(i_addr).val("");
	},
	proc_dir = function(func) {
		var dir = dirDisplay.getDirections();
		if (dir) {
			var steps = dir.routes[0].legs[0].steps;
			for (var i = 0; i < steps.length; i++)
				func(steps[i], i);
		}
	},
	get_dir_steps = function() {
		return dirDisplay.getDirections().routes[0].legs[0].steps;
	},
	get_dir_step = function(i) {
		return get_dir_steps()[i];
	},
	dirStepInfoWinClose = function() {
		dirStepInfoWin.close();
		google.maps.event.trigger(dirStepInfoWin, "closeclick");
	},
	dirStepInfoWinOpen = function() {
		dirStepInfoWin.open(gmap);
		dirStepInfoWin._view_ = true;
		dirStepMarker.setMap(gmap);
	},
	dirSelectStep = function(i, select_only) {
		var $tr = $(dirInfoContainer).find("table.adp-directions tr");
		var unselect_ = $tr.eq(i).hasClass("selected") && !select_only;
		proc_dir(function(step_, i_) {
			step_.poly.setOptions({ strokeColor: i_ == i && !unselect_ ? "#FF0000" : "#0000FF" });
		});
		$tr.removeClass("selected");
		if (!unselect_)
			return $tr.eq(i).addClass("selected");
	},
	dirScroll = function($tr) {
		if ($tr) {
			var $div = $(dirInfoContainer);
			$div.scrollLeft(0).scrollTop(
				$div.scrollTop() + $tr.position().top - ($div.height() - $tr.height()) / 2);
		}
	},
	dirStepInfoClick = function(step_index) {
		if (!dirDisplay.state_before_info_win)
			dirDisplay.state_before_info_win = { center: gmap.getCenter(), zoom: $.browser.msie ? gmap.getZoom() : zoom_previous };
		dirSelectStep(step_index, true);
		var dir_step = get_dir_step(step_index);
		dirStepInfoWin.setContent($("<div class='dir-step-info-container'>" +
			dir_step.instructions + "</div>").append(dirStreetViewContainer)[0]);
		dirStepInfoWin.setPosition(dir_step.start_location);
		dirStepInfoWinOpen();
		dirStreetView.setPov({ heading: 0, pitch: 0, zoom: 2 });
		dirStreetViewService.getPanoramaByLocation(dir_step.start_location, 50, function(data, status) {
			if (status != google.maps.StreetViewStatus.OK)
				dirStreetView.setVisible(false);
			else {
				dirStreetView.registerPanoProvider(function(pano) {
					return pano == data.location.pano ? data : null;
				});
				dirStreetView.setVisible(true);
				window.setTimeout(function() { dirStreetView.setPano(data.location.pano); }, 1);
			}
		});
	},
	remove_route = function() {
		remove_push_button_ctrl(dirInfoContainer);
		//dirDisplay.setOptions({
		//	map: null,
		//	panel: null
		//});
		dirStepInfoWinClose();
		proc_dir(function(step) { step.poly.setMap(null); });
		dirDisplay.setMap(null);
		//dirDisplay.setDirections({ routes: [] });
		remove_drive();
	},
	alert_select_address = function(i_addr) {
		alert("Please select address " + (parseInt(i_addr) == 1 ? "\"to\"" : "\"from\"") + " at the bottom of the page.");
		$addr_select(i_addr).focus();
	},
	get_address_by_latlng = function(i_addr, latLng, func) {
		$addr_input(i_addr).val("" + latLng.lat() + "," + latLng.lng());
		find_address(i_addr, func);		
	},
	get_route_click = function(latLng) {
		if (dir_displayed())
			return;
		if ($addr_select(0).is(":visible"))
			alert_select_address(0);
		else if ($addr_select(1).is(":visible"))
			alert_select_address(1);
		else if (!$.trim($addr_input(0).val() + $addr_input(1).val()))
			get_address_by_latlng(0, latLng);
		else
			get_route($.trim($addr_input(0).val()) ? 1 : 0, latLng);
	},
	get_route = function(i_addr, latLng) {
		i_addr = parseInt(i_addr) == 1 ? 1 : 0;
		remove_route();
		window.setTimeout(function() {
			find_address(1 - i_addr, function() {
				get_address_by_latlng(i_addr, latLng, function() {
					show_route();
				});
			});
		}, 1);
	},
	show_route = function() {
		if (address_marker(0).getMap() && address_marker(1).getMap()) {
			loading_show();
			dirService.route({
				origin: address_marker(0).getPosition(),
				destination: address_marker(1).getPosition(),
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			}, function(result, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					//var dirPanel = InfoWindowContentClick(
					//	$("<div style='font-size: 8pt; font-family: arial,sans-serif;' />") ,dirWindow);
					//dirDisplay.setOptions({
					//	suppressMarkers: true,
					//	//suppressInfoWindows: true,
					//	directions: result,
					//	panel: dirInfoContainer, // dirPanel
					//	map: gmap
					//});
					dirDisplay.setOptions({
						map: gmap,
						directions: result
					});
					proc_dir(function(step, i) {
						google.maps.event.addListener(step.poly = new google.maps.Polyline({
							map: gmap,
							path: step.path,
							strokeColor: "#0000FF",
							strokeOpacity: 0.5,
							strokeWeight: 5
						}), "click", function(evt) {
							if (driveSetPathFunc)
								driveSetPathFunc(evt.latLng, i);
							else if (!dirStepInfoWin._view_)
								dirScroll(dirSelectStep(i));
						});
					});
					//dirWindow.setOptions({
					//	position: address_marker(0).getPosition(),
					//	content: dirPanel,
					//	pixelOffset: new google.maps.Size(0, -23)
					//});
					//dirWindow.open(gmap);

					//show_ctrl(dirInfoContainer);
					add_push_button_ctrl(dirInfoContainer, "&nbsp;Directions")
						.find("div.push-button").append("<img src='images/close.png' class='remove-route' style='margin-left: 1px; margin-right: 3px;' title='Remove directions' />").end()
						.click();
					window.setTimeout(function() {
						$(dirInfoContainer).find("table.adp-directions tr").click(function() {
							dirStepInfoClick($(this).index());
						});
						$("<a href='javascript://' class='drive-animate-switch'>Animate</a>").appendTo(
							$(dirInfoContainer).find("div.adp-summary")
								.children().wrapAll("<span class='adp-summary-content' />").end()
						).click(toggle_drive);
					}, 1);
				}
				else
					alert("Directions service error.");
				loading_hide();
			});
		}
	},
	dir_displayed = function() {
		//return dirDisplay.getDirections() && dirDisplay.getDirections().routes.length > 0;
		return dirDisplay.getMap();
	},
	toggle_route_info = function() {
		if (dir_displayed())
			toggle_ctrl(dirInfoContainer);
	},
	xy_to_ll = function(xy) {
		//var ll = {}, tmp = xy.split(",");
		//SPCStoLL(parseFloat(tmp[0]), parseFloat(tmp[1]), ll);
		var tmp = xy.split(","),
			ll = { lat: parseFloat(tmp[0]), lon: parseFloat(tmp[1]) };
		return new google.maps.LatLng(ll.lat, ll.lon);
	},
	addr_select_change_func = function(i_addr, func) {
		return function(event) {
			if ($addr_select(i_addr).val()) {
				$(this).unbind(event);
				set_address(i_addr, $addr_select(i_addr).find("option:selected").text(), xy_to_ll($addr_select(i_addr).val()));
				if (func)
					func();
			}
		};
	};
	gotoAddress = function(i_addr) {
		if (!$addr_select(i_addr).is(":visible")) {
			remove_route();
			find_address(i_addr, function() { gmap.panTo(address_marker(i_addr).getPosition()); });
		} else
			alert_select_address(i_addr);
	};
	clearAddress = function(i_addr) {
		$addr_input(i_addr).val("");
		gotoAddress(i_addr);
	};
	showDirections = function() {
		if (dir_displayed())
			return;
		if ($addr_select(0).is(":visible"))
			alert_select_address(0);
		else if ($addr_select(1).is(":visible"))
			alert_select_address(1);
		else if ($.trim($addr_input(0).val()) && $.trim($addr_input(1).val())) {
			remove_route();
			window.setTimeout(function() {
				find_address(0, function() {
					find_address(1, function() {
						show_route();
					});
				});
			}, 1);
		}
	};

	// begin: Google Map controls helper functions
	var gmap_ctrls = gmap.controls[google.maps.ControlPosition.RIGHT],
	find_ctrl = function(e) {
		for (var i = 0; i < gmap_ctrls.getLength(); i++) {
			if (gmap_ctrls.getAt(i) === e) {
				return i;
			}
		}
	},
	toggle_ctrl = function(e, i) {
		if (find_ctrl(e) == null)
			show_ctrl(e, i);
		else
			hide_ctrl(e);
	},
	show_ctrl = function(e, p) {
		if (find_ctrl(e) == null) {
			if (typeof (p) == "number") {
				var tmp_ = [];
				while (gmap_ctrls.getLength() > p)
					tmp_.push(gmap_ctrls.removeAt(p));
				var func_ = function() { var e_ = tmp_.shift(); if (e_) show_ctrl(e_, func_); };
				show_ctrl(e, func_);
			}
			else {
				var $e = $(e).css("display", "none");
				gmap_ctrls.insertAt(gmap_ctrls.getLength(), e);
				if (typeof (p) == "function")
				//$e.slideDown(1, p);
					window.setTimeout(function() { $e.css("display", ""); p.call(e); }, 1);
				else
				//$e.slideDown(1);
					window.setTimeout(function() { $e.css("display", ""); }, 1);
			}
		}
	},
	hide_ctrl = function(e) {
		var i = find_ctrl(e);
		if (i != null)
			gmap_ctrls.removeAt(i);
	},
	_ctrls = function(func_ctrl, ctrls, p1, p2) {
		var old_ctrls = gmap_ctrls;
		gmap_ctrls = ctrls;
		func_ctrl(p1, p2);
		gmap_ctrls = old_ctrls;
	},
	bottom_ctrls = function(func_ctrl, p1, p2) { _ctrls(func_ctrl, gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER], p1, p2); },
	bottom_left_ctrls = function(func_ctrl, p1, p2) { _ctrls(func_ctrl, gmap.controls[google.maps.ControlPosition.BOTTOM_LEFT], p1, p2); },
	add_push_button_ctrl = function(e, captionHtml) {
		var $pb = $("<div class='push-button-container' style='margin-right: 5px;'><div unselectable='on' class='push-button'>" + captionHtml + "</div></div>").click(function() {
			if (find_ctrl(e) == null) {
				//$(this).addClass("pressed-container").children().addClass("pressed");
				show_ctrl(e, find_ctrl(this) + 1);
			}
			else {
				//$(this).removeClass("pressed-container").children().removeClass("pressed");
				hide_ctrl(e);
			}
		});
		gmap_ctrls.push(e.push_button_ctrl = $pb[0]);
		google.maps.event.addListener(gmap_ctrls, "remove_at", function(i_, e_) {
			if (e_ === e)
				$pb.removeClass("pressed-container").children().removeClass("pressed");
		});
		google.maps.event.addListener(gmap_ctrls, "insert_at", function(i_) {
			if (this.getAt(i_) === e)
				$pb.addClass("pressed-container").children().addClass("pressed");
		});
		return $pb;
	},
	remove_push_button_ctrl = function(e) {
		hide_ctrl(e);
		hide_ctrl(e.push_button_ctrl);
	};
	// end: Google Map controls helper functions

	// begin: tab-style controls:
	gmap_ctrls.push($("<table cellspacing='0' cellpadding='0' style='margin-right: 5px;'><tr></tr></table>")[0]);
	add_push_button_ctrl = function(e, captionHtml) {
		var $pb = $("<div class='push-button-container'><div unselectable='on' class='push-button'>" + captionHtml + "</div></div>").click(function() {
			if (find_ctrl(e) == null) {
				//$(this).addClass("pressed-container").children().addClass("pressed");
				while (gmap_ctrls.getLength() > 1)
					gmap_ctrls.removeAt(1);
				show_ctrl(e, 1);
			}
			else {
				//$(this).removeClass("pressed-container").children().removeClass("pressed");
				hide_ctrl(e);
			}
		});
		$("<td></td>").prependTo($(gmap_ctrls.getAt(0)).find("tr")).append(e.$push_button_ctrl = $pb);
		google.maps.event.addListener(gmap_ctrls, "remove_at", function(i_, e_) {
			if (e_ === e)
				$pb.removeClass("pressed-container").children().removeClass("pressed");
		});
		google.maps.event.addListener(gmap_ctrls, "insert_at", function(i_) {
			if (this.getAt(i_) === e)
				$pb.addClass("pressed-container").children().addClass("pressed");
		});
		return $pb;
	};
	remove_push_button_ctrl = function(e) {
		hide_ctrl(e);
		if (e && e.$push_button_ctrl)
			e.$push_button_ctrl.parent().remove();
	};
	// end: tab-style controls:

	google.maps.event.addListener(gmap, "rightclick", function(evt) { get_route_click(evt.latLng); });
	$(".remove-route").live("click", remove_route);
	//$("a#toggle-route").click(toggle_route_info);
	//gmap.controls[google.maps.ControlPosition.BOTTOM].push(loading_gif);

	var //driveInfoWin = new google.maps.InfoWindow(),
	driveStreetViewContainer = $("<div class='drive-streetview-container' />")[0],
	driveStreetView = driveStreetView_ = new google.maps.StreetViewPanorama(driveStreetViewContainer, {
		//enableCloseButton: true,
		//linksControl: false,
		//navigationControl: false,
		zoomControl: false,
		addressControl: false
	}),
	driveStreetViewEventListeners = [],
	driveStreetViewEvent = function(event, func) {
		if (driveStreetViewEventListeners[event])
			google.maps.event.removeListener(driveStreetViewEventListeners[event]);
		if (func)
			driveStreetViewEventListeners[event] = google.maps.event.addListener(driveStreetView_,
				event, func);
	},
	driveMarker = new google.maps.Marker(),
	remove_drive = function() {
		driveStreetViewSetResolution();
		driveMarker.setMap(null);
		driveHandlerFunc = null;
		driveSetPathFunc = null;
		bottom_ctrls(hide_ctrl, driveStreetViewContainer);
		//$(dirInfoContainer).find(".drive-animate-switch").html("animate");
	},
	toggle_drive = function() {
		if (driveMarker.getMap())
			remove_drive();
		else
			start_drive();
	},
	start_drive = function() {
		if (driveMarker.getMap())
			return; // one drive at a time
		else
			driveMarker.setMap(gmap);
		//$(dirInfoContainer).find(".drive-animate-switch").html("stop animation");
		driveHandlerFunc = null; // to ensure that switchDrivePlay won't call the driveHandlerFunc()
		switchDrivePlay(true);
		var steps = get_dir_steps(), drive_step = 0, drive_path = 0,
		set_cur_path = function(point, step_index) {
			var dist_ = earth_radius, step_, path_, func_ = function(s, i) {
				for (var j = 1; j < s.path.length; j++) {
					var tmp = geo_path_distance(s.path[j - 1], s.path[j], point);
					if (tmp < dist_) {
						dist_ = tmp;
						step_ = i;
						path_ = j - 1;
					}
				}
			};
			if (step_index != null)
				func_(steps[step_index], step_index);
			else
				proc_dir(func_);
			if (drive_step != step_) {
				drive_step = step_;
				dirScroll(dirSelectStep(drive_step, true));
			}
			drive_path = path_;
			next_point = steps[drive_step].path[drive_path];
			switch_next_point();
			cur_point = geo_path_point(prev_point, next_point, point);
			last_link = null;
			if (isDrivePaused())
				switchDrivePlay(true);
		},
		get_next_next_point = function(step_index, path_index) {
			if (++path_index < steps[step_index].path.length)
				return steps[step_index].path[path_index];
			else if (++step_index < steps.length)
				return steps[step_index].path[1];
		},
		get_next_point = function() {
			if (++drive_path < steps[drive_step].path.length)
				return steps[drive_step].path[drive_path];
			else if (++drive_step < steps.length) {
				dirScroll(dirSelectStep(drive_step, true));
				return steps[drive_step].path[drive_path = 1];
			}
		},
		bearing, cur_point, prev_point, next_point = steps[drive_step].path[drive_path],
		switch_next_point = function() {
			if (next_point)
				prev_point = cur_point = next_point;
			next_point = get_next_point();
			if (next_point)
				bearing = geo_bearing(prev_point, next_point);
		},
		past_next_point = function(point) {
			return (Math.abs(heading_delta(geo_bearing(point, next_point), bearing)) > 100);
		},
		switch_path = function(point1, point2) {
			return (past_next_point(point1) || (past_next_point(point2) &&
				geo_distance(point1, next_point) < geo_distance(point2, next_point)));
		},
		move_cur_point = function() {
			if (next_point) {
				var old_cur_point = cur_point;
				cur_point = geo_ll_to(
					geo_cross_track_point(cur_point, prev_point, bearing), bearing, 10);
				if (switch_path(old_cur_point, cur_point)) {
					switch_next_point();
					return true;
				}
			}
		},
		get_link = function(links, heading) {
			if (heading != null && links && links.length > 0) {
				var link = links[0], angle = heading_angle;
				for (var i = 1; i < links.length; i++) {
					if (angle(links[i].heading, heading) < angle(link.heading, heading))
						link = links[i];
				}
				if (angle(link.heading, heading) < 45)
					return link;
			}
		},
		last_link, last_data,
		set_last_link = function(data, bearing) {
			if (last_link = get_link(data.links, bearing)) {
				cur_point = data.location.latLng;
				return true;
			}
		},
		show_data_get_link = function(data) {
			last_data = data;
			if (!set_last_link(data, last_link ? last_link.heading : bearing) && move_cur_point())
				set_last_link(data, bearing);
			var bearing_delta, next_next_point;
			// to remove bearing adjustment prior the turn comment out the "if" block below
			if (geo_distance(data.location.latLng, next_point) < 20 && (next_next_point = get_next_next_point(drive_step, drive_path))) {
				var delta_ = heading_delta(geo_bearing(next_point, next_next_point), bearing);
				bearing_delta = Math.min(Math.abs(delta_) / 2, 45) * (delta_ > 0 ? 1 : -1);
			}
			set_heading_and_animation(bearing_delta ? bearing + bearing_delta :
				last_link ? last_link.heading : bearing);
			driveStreetView.registerPanoProvider(function(pano) { return data; });
			driveStreetView.setPano(data.location.pano);
			driveStreetView.setVisible(true);
		},
		set_drive_marker_heading = function(heading) {
			set_marker_heading(driveMarker, heading, "images/blue_arrow/tba", 20);
		},
		set_pov = function(heading, pitch, zoom) {
			var pov = driveStreetView.getPov();
			driveStreetView.setPov({
				heading: heading,
				pitch: pitch != null ? pitch : pov.pitch,
				zoom: zoom != null ? zoom : pov.zoom
			});
			set_drive_marker_heading(heading);
		},
		drive_speed_timeout = function() {
			return 201 + (5 - driveSpeed) * 120;
		},
		turn_speed_timeout = function() {
			return 1 + (5 - driveSpeed) * 40;
		},
		set_heading_and_animation = function(heading, no_animation, total_timeout, min_drive_timeout) {
			min_drive_timeout = isNaN(min_drive_timeout) ? 0 : min_drive_timeout;
			var heading_timeout = 200 + turn_speed_timeout(),
				drive_timeout = Math.max(400 + drive_speed_timeout(), min_drive_timeout);
			total_timeout = isNaN(total_timeout) ? 0 : total_timeout;
			var cur_heading = driveStreetView.getPov().heading,
				dHeading = heading_delta(heading, cur_heading);
			if (no_animation || Math.abs(dHeading) < 10) {
				set_pov(heading);
				window.setTimeout(drive, heading_timeout +
					Math.max(drive_timeout - total_timeout - heading_timeout, 0));
			}
			else {
				set_pov(heading_turn(cur_heading, dHeading > 0 ? 10 : -10));
				window.setTimeout(function() {
					set_heading_and_animation(heading, false, total_timeout + heading_timeout);
				}, heading_timeout);
			}
		},
		too_aside = function(point) {
			return (Math.abs(geo_cross_track_distance(point, prev_point, bearing)) > 5);
		},
		drive = function() {
			if (!driveMarker.getMap() || !next_point || isDrivePaused()) {
				driveStreetView.registerPanoProvider();
				driveStreetViewEvent("pov_changed", function() {
					set_drive_marker_heading(heading_normalize(this.getPov().heading));
				});
				switchDrivePlay(false);
				return next_point;
			}
			//if (blank_pano_lock) {
			//	window.setTimeout(drive, 100);
			//	return next_point;
			//}
			if (last_link)
				dirStreetViewService.getPanoramaById(last_link.pano, function(data, status) {
					if (status != google.maps.StreetViewStatus.OK) {
						set_heading_and_animation(bearing/*, true*/);
						driveStreetView.setVisible(false);
					}
					else if (switch_path(cur_point, data.location.latLng)) {
						switch_next_point();
						last_link = get_link(last_data.links, bearing);
						set_heading_and_animation(last_link ? last_link.heading : bearing);
					}
					else if (too_aside(data.location.latLng)) {
						move_cur_point();
						last_link = null;
						set_heading_and_animation(bearing);
					}
					else
						show_data_get_link(data);
				});
			else
				dirStreetViewService.getPanoramaByLocation(cur_point, 10, function(data, status) {
					if (status != google.maps.StreetViewStatus.OK || too_aside(data.location.latLng)) {
						set_heading_and_animation(bearing/*, true*//*, 0, isDriveBlankPano() ? 0 : 350*/); // IE timeout fix
						//blank_pano_lock = true;
						//google.maps.event.addListenerOnce(driveStreetView, "pano_changed", function() {
						//	blank_pano_lock = false;
						//	//alert("blank pano " + driveStreetView.getPano());
						//});
						//drive_position_changed(cur_point);
						//driveStreetView.setVisible(false);
						data = {
							"location": {
								"latLng": cur_point,
								"description": "blank white",
								"pano": blank_pano_prefix + ++blank_pano_counter
							},
							"copyright": "(c)",
							"links": [/*{
								"heading": number,
								"description": string,
								"pano": string,
								"roadColor": string,
								"roadOpacity": number
							}*/],
							"tiles": {
								"getTileUrl": function() {
									return "images/no_street_view_w.png";
								},
								"worldSize": new google.maps.Size(256, 128),
								"tileSize": new google.maps.Size(512, 256),
								"centerHeading": 90
							}
						};
						driveStreetView.registerPanoProvider(function(pano) { return data; });
						driveStreetView.setPano(data.location.pano);
						move_cur_point();
					}
					else
						show_data_get_link(data);
				});
			return next_point;
		},
		drive_position_changed = function(position) {
			if (!position)
				position = driveStreetView.getPosition();
			if (!position.equals(driveMarker.getPosition())) {
				//driveInfoWin.setPosition(position);
				driveMarker.setPosition(position);
				var projection = gmap.getProjection(),
					point = projection.fromLatLngToPoint(position),
					scale = Math.pow(2, gmap.getZoom());
				gmap.setCenter(projection.fromPointToLatLng(new google.maps.Point(point.x,
					point.y + $(driveStreetViewContainer).height() / 2 / scale)));
			}
		};
		driveHandlerFunc = drive;
		driveSetPathFunc = set_cur_path;
		dirDisplay.center_before_drive = gmap.getCenter();
		driveStreetViewEvent("position_changed", drive_position_changed);
		driveStreetViewEvent("pov_changed");
		//driveInfoWin.setContent(driveStreetViewContainer);
		//driveInfoWin.open(gmap);
		bottom_ctrls(show_ctrl, driveStreetViewContainer);
		dirScroll(dirSelectStep(drive_step, true)); // select 1st directions step
		switch_next_point(); // initialize start point and bearing
		drive_position_changed(cur_point);
		set_pov(bearing, 0, 2); // set Point of View (POV)
		drive();
	},
	driveHandlerFunc, driveSetPathFunc,
	driveStreetViewPlayControl = $("<img src='images/pause_30.png' border='0' title='pause' />")
		.click(function() { switchDrivePlay(isDrivePaused()); })[0],
	isDrivePaused = function() { return driveStreetViewPlayControl.src.toLowerCase().indexOf("play") > -1; },
	switchDrivePlay = function(play) {
		driveStreetViewPlayControl.src = play ? "images/pause_30.png" : "images/play_30.png";
		driveStreetViewPlayControl.title = play ? "pause" : "play";
		if (driveHandlerFunc && play)
			if (!driveHandlerFunc())
				driveSetPathFunc(get_dir_step(0).start_location, 0);
	},
	driveSpeed = 5,
	driveStreetViewSpeedControl = $("<div class='drive-street-view-speed-control' />")
		.slider({
			min: 0, max: 10, step: 1, value: driveSpeed,
			change: function(evt, ui) { driveSpeed = ui.value; }
		})[0],
	driveStreetViewStopControl = $("<img src='images/stop_30.png' border='0' title='stop' />")
		.click(remove_drive)[0],
	driveStreetViewResolutionControl = $("<select><option>250x150</option><option selected>400x250</option><option>500x350</option><option>800x600</option><option>Full Screen</option></select>")
		.change(function() {
			driveStreetViewSetResolution($(this).children().eq(this.selectedIndex).text());
		})[0],
	driveStreetViewResolutionContainer = $("<span class='drive-street-view-resolution-container' />")
		.append(driveStreetViewResolutionControl)[0],
	driveStreetViewButtonContainer = $("<span class='drive-street-view-button-container' />")
		.append(driveStreetViewPlayControl).append(driveStreetViewStopControl)[0],
	blank_pano_counter = 0,
	blank_pano_prefix = "_blank_",
	//blank_pano_lock = false,
	isDriveBlankPano = function() {
		return (driveStreetView.getPano().substring(0, blank_pano_prefix.length) == blank_pano_prefix);
	},
	dsv_right_top_ctrls = function(func_ctrl, p1, p2) { _ctrls(func_ctrl, driveStreetView.controls[google.maps.ControlPosition.RIGHT_TOP], p1, p2); },
	dsv_top_right_ctrls = function(func_ctrl, p1, p2) { _ctrls(func_ctrl, driveStreetView.controls[google.maps.ControlPosition.TOP_RIGHT], p1, p2); },
	driveStreetViewControls = function(func) {
		dsv_top_right_ctrls(func, driveStreetViewSpeedControl);
		dsv_right_top_ctrls(func, driveStreetViewResolutionContainer);
		dsv_right_top_ctrls(func, driveStreetViewButtonContainer);
	},
	driveStreetViewSetResolution = function(resolution) {
		if (!resolution)
			resolution = lastDriveStreetViewResolution;
		$(driveStreetViewResolutionControl).val(resolution);
		var tmp = resolution.split("x");
		if (tmp.length > 1) {
			if (driveStreetView == gmap.getStreetView()) {
				driveStreetView_.setPosition(driveStreetView.getPosition());
				driveStreetView_.setPov(driveStreetView.getPov());
				driveStreetView.setVisible(false);
				driveStreetView.setEnableCloseButton(true);
				driveStreetViewControls(hide_ctrl);
				driveStreetView = driveStreetView_;
				driveStreetViewControls(show_ctrl);
			}
			$(driveStreetViewContainer).width(parseInt(tmp[0])).height(parseInt(tmp[1]));
			google.maps.event.trigger(driveStreetView, 'resize');
			lastDriveStreetViewResolution = resolution;
		} else if (driveStreetView == driveStreetView_) {
			driveStreetViewControls(hide_ctrl);
			driveStreetView = gmap.getStreetView();
			driveStreetViewControls(show_ctrl);
			driveStreetView.setEnableCloseButton(false);
			driveStreetView.setPosition(driveStreetView_.getPosition());
			driveStreetView.setPov(driveStreetView_.getPov());
			driveStreetView.setVisible(true);
		}
	},
	lastDriveStreetViewResolution = $(driveStreetViewResolutionControl).children().eq(driveStreetViewResolutionControl.selectedIndex).text();
	driveStreetViewControls(show_ctrl);
	//google.maps.event.addListener(driveMarker, "click", remove_drive);
	//google.maps.event.addListener(driveInfoWin, "closeclick", function() {
	//	driveStreetView.setVisible(false);
	//	if (dirDisplay.center_before_drive)
	//		gmap.setCenter(dirDisplay.center_before_drive);
	//});

};
