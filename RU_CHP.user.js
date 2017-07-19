// ==UserScript==
// @name           RU_CHP
// @author         Alexey Shumkin aka Zapped
// @license        GPL
// @version        0.0.6.3 - fixes
// @version        0.0.6.1
// @history        0.0.6.2 - Added start time and end time to original embeded code.
// @history        0.0.6.1 - Skip inlined NOT from Youtube videos
// @history        0.0.6 - Added Youtube field (to open video on Youtube with predefined time)
// @history        0.0.5.2 - Fixed ?style=mine
// @history        0.0.5.1 - Fixed variables error
// @history        0.0.5 - Added support for Opera, removed alk.lv (invalid backup site long time ago)
// @history        0.0.4 - Added redirect to rucrash video player
// @namespace      http://ru_chp.livejournal.com/
// @description    improve video view in ru_chp (inspired with http://www.alk.lv/RU_CHP.user.js)
// @include        http://ru-chp.livejournal.com*
// @exclude        http://ru-chp.livejournal.com/ru_chp/*
// @grant          none
// ==/UserScript==

!function(win) {
    
    
	if (win.self != win.top) return;
	var doc = win.document;

	function append_form(element, url, form_content, num) {
		var form = doc.createElement("form");
		form.setAttribute("action", url);        
        if (num == 1) {
        	form.setAttribute("style", "float:left;");
        }
        else {
         form.setAttribute("style", "padding-left:20px;padding-bottom:10px;float:left;");   
        }
		form.setAttribute("target", "_blank");
		form.innerHTML=form_content;

		element.appendChild(form);        
	}

	function append_forms_by_id(element, id) {
		var ruchp_suffix = '/ruchp';
		var ruchp_suffix_ = ruchp_suffix  + '/';
		
		var rucrash_site = 'rucrash.com';
		var rucrash_video_url = 'http://video.' + rucrash_site + ruchp_suffix_ + id + ".mp4";
	/*	text =
	'<input type="text" size="50" readonly="readonly" class="text" value="' + rucrash_video_url + '">' +
	'<input type="submit" class="submit" value="download from ' + rucrash_site + '" alt="Ok"> ';
		append_form(element, rucrash_video_url, text);
*/
		var rucrash_player_url = 'http://www.' + rucrash_site + ruchp_suffix_;
		var text =
	/*'<input type="text" size="50" readonly="readonly" class="text" value="' + rucrash_player_url + '?v=' + id + '">' +*/
	'<input type="hidden" name="v" value="' + id + '">' +
	'<input type="submit" class="submit" value="play on ' + rucrash_site + '" alt="Ok"> ';
		append_form(element, rucrash_player_url, text,1);
	}

	function append_resolved_video(element, id_array) {
		// do not add videos NOT from Youtube
		if (id_array == null) return;
		var id = id_array.id;
		var time = id_array.time;
		var time_str = '';
		if (time != 0) {
			time_str = '&amp;t=' + time + 's'
		}
		var youtube_site = 'http://www.youtube.com/watch?v=' + id + time_str;
		text =
		/*	'<input type="text" size="50" readonly="readonly" class="text" value="' + youtube_site + '">' +*/
			'<input type="hidden" name="v" value="' + id + '">' +
			(time_str != '' ? '<input type="hidden" name="t" value="' + time + 's">' : '') +
			'<input type="submit" class="submit" value="watch on Youtube" alt="Ok"> ';
		append_form(element, youtube_site, text,2);
	}

	function append_resolved_videos(element, videos) {
		for (var i = 0; i < videos.length; i++) {
			append_resolved_video(element, videos[i]);
		}
	}

	function inlined_videos_count(element) {
		var videos = element.getElementsByTagName("iframe");
		if (videos && videos.length != 0) {
			return videos.length;
		} else {
			var hrefs = element.getElementsByTagName("a");
			var vcount = 0;
			for (var i = 0; i < hrefs.length; i++) {
				if (hrefs[i].getAttribute("class") && hrefs[i].getAttribute("class").indexOf("b-mediaplaceholder-video") > 0)
					vcount += 1;
			}
			return vcount;
		}
	}

	function convert_to_seconds(match) {
		var minutes = parseInt(match[1]);
		var seconds = parseInt(match[2]);
		seconds = 60 * minutes + seconds;
		return seconds;
	}

	function extract_times(element, videos) {
        //var times_re = /[^.:-\d](\d{1,2})[:.-](\d{2})[^.:-\d]/;
        var times_re = /(?:от|с|c|from)\s?(\d{1,2})[:.-](\d{2})/gi;
        var times_re_word = /с (\d+)(-?й? ?)?(сек|c\b)/ig;
        var times_re_to = /(?:до|to)\s(\d{1,2})[:.-](\d{2})/gi;
		var body_entry = element.getElementsByClassName('entry-content');
        
		if (body_entry && body_entry[0]) {
			body_entry = body_entry[0].textContent;
		} else {
			// ?style=mine
			body_entry = element.getElementsByClassName('b-singlepost-body')
			if (body_entry && body_entry[0]) {
				body_entry = body_entry[0].textContent;
			}
		}
       // alert(body_entry);
		var match = null;
        var match2 = null;
        var match_to = null;
		var count = 0;
        
		if ((match = times_re.exec(body_entry))
            || (match2 = times_re_word.exec(body_entry))
            
            || (match_to = times_re_to.exec(body_entry))
           
           ) {                        			
            
			if (videos[count]) {
                                
                videos[count].frame.src = "http://youtube.com/embed/"+videos[count].id+"?rel=0";
                              
                if (match) {
                    videos[count].time = convert_to_seconds(match);
                	videos[count].frame.src += "&start="+videos[count].time;
                }
                else if (match2) {

                    videos[count].time = convert_to_seconds(match2);
                	videos[count].frame.src += "&start="+videos[count].time;                    
                }
                    
                if (match_to) {
                    videos[count].time_to = convert_to_seconds(match_to);
                    videos[count].frame.src += "&end="+ convert_to_seconds(match_to);
                }
                
                
			}
		}
		return videos;
	}

	function extract_youtube_url(src) {
		src = unescape(src);
		params = src.split('&');
		var id, source = undefined;
		for (var i = 0; i < params.length; i++) {
			key_value = params[i].split('=');
			if (key_value[0] == 'source') {
				source = key_value[1];
				if (source != 'youtube') {
					source = undefined;
				}
			} else if (key_value[0] == 'vid') {
				id = key_value[1];
			}
		}
		// if we do not know where source from
		if (source == undefined) {
			id = null;
		}
		return id;
	}

	function resolve_video_url(frame) {
        
        var result = { id: extract_youtube_url(frame.src), time: 0, frame: frame};
		if (! result.id) {
			result = null;
		}
		return result;
	}

	function get_resolved_videos(frames) {
		var result = new Array();
		for (var i = 0; i < frames.length; i++) {
			result[i] = resolve_video_url(frames[i]);
		}
		return result;
	}

	function get_inlined_videos(element) {
		var videos = element.getElementsByTagName("iframe");
		videos = get_resolved_videos(videos);
		videos = extract_times(element, videos);
		return videos;
	}

	function find_id(element, entry) {
		// if there are no videos
		// there is no reason to search id
		if (inlined_videos_count(entry) == 0)
			return false;
		var ruchp = "http://ru-chp.livejournal.com/";
		// if element is not document
		if (element.getElementById === undefined) {
			var as = element.getElementsByTagName("a")[0];
			as = as.getAttribute("href");
			// ensure that current post is in ru-chp
			if (as && as.indexOf(ruchp) == 0)
				return as.replace(ruchp, "").replace(".html", "");
		} else {
			// find in current open post
			var postform = element.getElementById("postform");
			if (!postform)
				return false;
			// ensure that current post is in ru-chp
			if (element.location.toString().indexOf(ruchp) != 0)
				return false;
			var inputs = postform.getElementsByTagName("input");
			for (var i = 0; i < inputs.length; i++) {
				if (inputs[i].getAttribute("name") == "itemid")
					return inputs[i].getAttribute("value");
			}
		}
		return false;
	}

	function append_in_mine_style() {
		var entry = doc.getElementsByClassName('s-body')[0];        
		// if single post view
		if (entry) {
            
			id = find_id(doc, entry);
			article = entry.getElementsByClassName('b-singlepost-wrapper')[0]
            
			if (article) {                
                
				append_forms_by_id(article, id);
				videos = get_inlined_videos(article);
				append_resolved_videos(article, videos);
			}
		} else {
			entries = doc.getElementsByTagName('div');
			for (var i = 0; i < entries.length; i++ ) {
				// find post
				var entry = entries[i];
				var id = false;
				// if community feed
				if (entry.getAttribute("style") == "text-align:left") {
					id = find_id(entry, entry);
				}
				if (id) {
					append_forms_by_id(entry, id);
					videos = get_inlined_videos(entry);
					append_resolved_videos(entry, videos);
				}
			}
		}
	}

	function append_in_own_style() {
		var entries = doc.getElementsByTagName('dl');
		// enumerate all <dl> tags
		for (var i = 0; i < entries.length; i++ ) {
			// find every post
			if (entries[i].getAttribute("class") == "entry hentry") {
				id = entries[i].id;

				var dds = entries[i].getElementsByTagName('dd');
				for (var j = 0; j < dds.length; j++ ) {
					entry = dds[j]
					if (entry.getAttribute("class") == "entry-text") {
						if (inlined_videos_count(entry) == 0)
							// if no videos, do not add any forms
							continue;
						// find post text
						id = id.replace("post-ru_chp-", "");
						append_forms_by_id(entry, id);
						videos = get_inlined_videos(entry);
						append_resolved_videos(entry, videos);
					}
				}
			}
		}
	}

	win.addEventListener("load", function() {
		// determine own/mine style
		// own community style has <html xmlns=""...
        
		mine_style = doc.getElementsByTagName("html")[0].getAttribute("xmlns") == null;
		// for own community view-style
		if (mine_style) {
			append_in_mine_style();
		} else {
			append_in_own_style();
		}
	}, false);

}(typeof unsafeWindow == 'undefined' ? window : unsafeWindow)
