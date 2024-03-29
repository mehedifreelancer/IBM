(function(){

    if (typeof(provely) != 'undefined')
    {
        return;
    }

    window['provely'] = {
        config: {
            'baseUrl' : null,
            'pixelName' : 'provelytrackingPixel',
            'https' : 0,
            'delay' : 10,
            'effect' : 'bounce',
            'initial_wait' : 0,
            'show' : 1,
            'track' : 0,
            'widget' : 0
        },

        data : {
            'campaignId' : null,
            'seenCount': 0,
            'contacts': [],
        },

        fields : [],

        getUrl : function(url)
        {
            return provely.config.baseUrl + url;
        },

        validateEmail : function (email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        },

        set : function(key, val, target)
        {
            if (typeof(target) == 'undefined') {target = 'data';}
            provely[target][key] = val;
        },

        scanObj : function()
        {
            if (typeof(window['provelysObj']) == 'undefined')
            {
                return;
            }

            var ob = window['provelysObj'];

            for (i in ob)
            {
                provely.checkArgs(ob[i]);
            }

            window['provelysObj'].push = function() {

                provely.checkArgs(window['provelysObj'][window['provelysObj'].length - 1]);

                return Array.prototype.push.apply(this, arguments);
            }
        },

        checkArgs : function(args)
        {
            switch (args[0])
            {
                case 'set':
                case 'config':
                case 'data':
                    provely.set(args[1], args[2], args[0]);
                    break;
                case 'send':
                    provely.set('event', args[1]);
                    provely.sendData(data);
                    break;
                default:
                    break;
            }
        },

        sendData: function(obj)
        {
            if (provely.data.campaignId == null)
            {
                console.log('Nope');
                return;
            }

            // build the url from data
            var str = [];
            for (var key in obj)
            {
                val = obj[key];

                if ( Object.prototype.toString.call( val ) === '[object Array]' )
                {
                    val = val.join(',');
                }

                str.push(key + "=" + encodeURIComponent(val));
            }

            str = str.join('&');

            // load the url
            provely.loadPixel(str);
        },

        loadPixel: function(url)
        {
            if (typeof(url) == 'undefined')
            {
                url = '';
            }

            var pixel = document.getElementById(provely.config.pixelName);

            if (pixel == null)
            {
                // create new one
                provely.createPixel(url);
            } else {
                pixel.setAttribute('src', provely.getUrl('track/collect?' + url));
            }
        },

        createPixel: function(url, pixel)
        {
            if (typeof(pixel) == 'undefined')
            {
                pixel = provely.config.pixelName;
            }

            var myImg=document.createElement("img");
            myImg.setAttribute('id', pixel);
            myImg.setAttribute('src', provely.getUrl('track/collect?' + url));
            myImg.setAttribute('height', '1px');
            myImg.setAttribute('width', '1px');
            myImg.style.display = 'none';
            document.body.appendChild(myImg);

            return document.getElementById(provely.config.pixelName);
        },

        recordEmail: function(em)
        {
            if (!provely.validateEmail(email))
            {
                return false;
            }

            provely.set('email', em);

            provely.sendData(provely.data);
        },

        getRequiredFieldNames: function(fields) {
            var requiredFields = [];

            for (var key in fields) {
                if (!fields.hasOwnProperty(key)) {
                    continue;
                }

                if (fields[key]['required'] == "true") {
                    requiredFields.push(fields[key]['name']);
                }
            }

            return requiredFields;
        },

        requiredFieldsAreFilled: function() {
            var passed = true;
            for (var i=0; i < provely.requiredFieldNames.length; i++) {
                $pv('[provely-data]').each(function(index) {
                    var fieldName = $pv(this).attr('name');

                    if (provely.requiredFieldNames[i] === fieldName && !$pv(this).val()) {
                        passed = false;
                    }
                });
            }

            return passed;
        },

        bindFields: function()
        {
            console.log('Binding fields ..');
            provely.requiredFieldNames = provely.getRequiredFieldNames(provely.fields);
            if (provely.fields == null)
            {
                $pv('input[name]').filter(function() {
                    return (/email/i).test($pv(this).attr('name'));
                }).attr('provely-data', 'email');
            } else {
                for (var i in provely.fields)
                {
                    if (provely.fields[i]['id'] != null)
                    {
                        // bind by ID
                        $pv('#' + provely.fields[i]['id']).attr('provely-data', i);
                    } else {
                        if (provely.fields[i]['name'] != null)
                        {
                            $pv('[name="' + provely.fields[i]['name'] + '"]').attr('provely-data', i);
                        }
                    }
                }
            }

            setTimeout(function(){
                $pv('[provely-data]').on('blur', function(){
                    switch ($pv(this).attr('provely-data'))
                    {
                        case 'firstname':
                        case 'lastname':
                            provely.set($pv(this).attr('provely-data'), $pv(this).val());

                            // email is always required so we check if there are more than 1 required fields.
                            // This is to fix issue where names are not captured when email field is filled in before name fields.
                            // If they didn't specify firstname or lastname as a required field then we don't need to sendData here,
                            // sendData will be called when email is filled in.
                            if (provely.requiredFieldNames.length > 1) {
                                if (provely.requiredFieldsAreFilled())
                                    provely.sendData(provely.data);
                            }

                            break;
                        case 'email':
                            var email = $pv(this).val();

                            if (!provely.validateEmail(email))
                            {
                                return false;
                            }

                            provely.set('email', email);

                            // email is always required so we check if there are more than 1 required fields.
                            // This is to fix issue where names are not captured when email field is filled in before name fields.
                            if (provely.requiredFieldNames.length > 1) {
                                if (provely.requiredFieldsAreFilled())
                                    provely.sendData(provely.data);
                            } else {
                                provely.sendData(provely.data);
                            }
                            break;
                    }
                });
            }, 200);
        },

        jqLoad : function()
        {
            window['$pv'] = window.jQuery.noConflict(true);

            provely.scanObj();

            provely.config.baseUrl = 'http' + ((provely.config.https == 1) ? 's': '' )+ '://' + provely.config.baseUrl + '/';


            // Fetch Campaign Data
            // --------------------
            $pv.post(provely.config.baseUrl + 'api/campaigns/'  + provely.data['campaignId'] + '/campaign',
                {
                    'campaignId' : provely.data['campaignId'],
                    'domain' : window.location.hostname,
                    'page' : encodeURIComponent(window.location.pathname)
                },
                function(data)
                {
                    if (provely.config.track == 1)
                    {
                        if (typeof(data.fields) != null)
                        {
                            provely.fields = data.fields;
                        }

                        provely.bindFields();
                    }

                    // Show Widget
                    // ------------
                    if ( (provely.config.widget == 1) && (data.show == 1) )
                    {
                        provely.config['delay'] = data.delay;
                        provely.config['effect'] = data.effect;
                        provely.config['location'] = data.location;
                        provely.config['show_counters'] = data.show_counters;
                        provely.config['initial_wait'] = data.initial_wait;
                        provely.config['counter_text'] = data.counter_text;
                        provely.config['template'] = data.template;
                        provely.config['name_color'] = data.name_color;
                        provely.config['message_color'] = data.message_color;
                        provely.config['time_color'] = data.time_color;
                        provely.config['branding'] = data.branding;
                        provely.config['sound'] = data.sound;
                        provely.config['utm'] = data['utm'];


                        // Append animation css
                        // ---------------------
                        var cssId = 'provelycss';  // you could encode the css path itself to generate id..
                        if (!document.getElementById(cssId))
                        {
                            var head  = document.getElementsByTagName('head')[0];
                            var link  = document.createElement('link');
                            link.id   = 'provelycss';
                            link.rel  = 'stylesheet';
                            link.type = 'text/css';
                            link.href = provely.config.baseUrl + 'stylesheets/animate.css';
                            link.media = 'all';
                            head.appendChild(link);
                        }

                        if (data.show_on_mobile == 0)
                        {
                            if (provely.mobilecheck() === false)
                            {
                                setTimeout(function(){
                                    provely.displayWidget();
                                }, data.initial_wait * 1000);

                            }
                        } else {
                            setTimeout(function(){
                                provely.displayWidget();
                            }, data.initial_wait * 1000);
                        }
                    }

                }
            );

            // check if you need to run setup
            provely.setupMode();
        },

        setupMode : function()
        {
            if (window.location.href.indexOf('#setup') != -1)
            {
                var pvdiv = document.createElement('div');
                pvdiv.id = 'provely-setup-widget';
                document.getElementsByTagName('body')[0].appendChild(pvdiv);

                $pv('#provely-setup-widget')
                    .css('position', 'fixed')
                    .css('top', 20)
                    .css('right', 20)
                    .css('padding', '10px 20px')
                    .css('cursor', 'hand')
                    .css('z-index', 9999)
                    .css('opacity', 1)
                    .css('border-radius', "5px")
                    .css('background-color', '#2ecc71')
                    .css('color', '#fff')
                    .css('font-family', '"Helvetica", "Arial"')
                    .html('Save & Close')
                    .click(function(){
                        provely.scanSetupMode();
                    });
            }
        },

        scanSetupMode : function()
        {
            $pv('input').each(function(){
                var trg = null;
                var required = false;
                switch ($pv(this).val())
                {

                    case 'firstname-required':
                        required = true;

                    case 'firstname':
                    case 'FIRSTNAME':
                        trg = 'firstname';
                        break;

                    case 'lastname-required':
                        required = true;

                    case 'lastname':
                    case 'LASTNAME':
                        trg = 'lastname';
                        break;

                    case 'email':
                    case 'EMAIL':
                    case 'provelyemail':
                        trg = 'email';
                        required = true;
                        break;

                    default:
                        break;
                }

                if (trg != null)
                {
                    if (provely.fields == null)
                    {
                        provely.fields = {};
                    }

                    provely.fields[trg] = {
                        'id' : null,
                        'name' : null,
                        'required' : required,
                    };

                    if ($pv(this).attr('id') != undefined)
                    {
                        provely.fields[trg].id = $pv(this).attr('id');
                    }

                    if ($pv(this).attr('name') != undefined)
                    {
                        provely.fields[trg].name = $pv(this).attr('name');
                    }
                }

            });

            $pv.post(provely.config.baseUrl + 'api/campaigns/' + provely.data.campaignId + '/setup',
                {
                    'campaignId' : provely.data['campaignId'],
                    'fields' : provely.fields
                },
                function()
                {
                    window.location.href = window.location.href.replace('#setup', '');
                }
            );
        },

        displayWidget: function()
        {
            if (provely.config.show == 0)
            {
                setTimeout(function(){
                    provely.displayWidget();
                }, provely.config.delay * 1000);

                return;
            }

            var url = provely.config.baseUrl + 'api/campaigns/' + provely.data.campaignId + '/contacts?ref=' + encodeURIComponent(window.location.href) + '&r=' + Math.random();

            if (provely.data.contacts.length < 1 || provely.data.seenCount >= provely.data.contacts.length )
            {
                $pv.post(url, {'domain': window.location.hostname}, function(res) {

                    if (res.contacts !== undefined && res.contacts.length > 0)
                    {
                        provely.data.seenCount = 0;
                        provely.data.contacts = res.contacts;
                        provely.displayWidget();
                    } else if (res.message == 'reset_contacts')
                    {
                        provely.displayWidget();
                    }

                })
                .fail(function(err) {
                    console.log(err);
                    setTimeout(function() {
                        provely.displayWidget();
                    }, (60 * 5) * 1000); // If there are no contacts, check the server again in 5 minutes.
                });
            } else
            {
                var pvdiv = document.createElement('div');
                pvdiv.id = 'provely-widget';
                document.getElementsByTagName('body')[0].appendChild(pvdiv);

                $pv('#provely-widget')
                    .css('width', 380)
                    .css('height', 110)
                    .css('position', 'fixed')
                    .css('z-index', '2147483647')
                    .css('opacity', 0);

                var $provelyIframe = $pv('<iframe id="provely-iframe" frameborder="no"  scrolling="no" style="width: 100%; height: 100%;" ></iframe>');

                //setTimeout(function() {

                    $provelyIframe.appendTo('#provely-widget').ready(function() {

                        $provelyIframe.contents().find('head').append('<title>Provely</title>');
                        $provelyIframe.contents().find('head').append('<meta charset="utf-8">');
                        $provelyIframe.contents().find('head').append('<meta http-equiv="X-UA-Compatible" content="IE=edge">');
                        $provelyIframe.contents().find('head').append('<meta name="viewport" content="width=device-width, initial-scale=1">');
                        //$provelyIframe.contents().find('head').append('<link href="https://s3.amazonaws.com/provely-public/stylesheets/widgets-embed.css" rel="stylesheet">');
                        $provelyIframe.contents().find('head').append('<style>.desc-heading-name,h4.desc-heading_foot,span.desc-heading-name{white-space:nowrap;text-overflow:ellipsis}*,:after,:before{box-sizing:inherit}html{box-sizing:border-box;font-family:sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}/*! normalize.css v3.0.3 | MIT License | github.com/necolas/normalize.css */img,legend{border:0}legend,td,th{padding:0}body{margin:0}article,aside,details,figcaption,figure,footer,header,hgroup,main,menu,nav,section,summary{display:block}audio,canvas,progress,video{display:inline-block;vertical-align:baseline}audio:not([controls]){display:none;height:0}[hidden],template{display:none}a{background-color:transparent}a:active,a:hover{outline:0}abbr[title]{border-bottom:1px dotted}b,optgroup,strong{font-weight:700}dfn{font-style:italic}h1{margin:.67em 0;font-size:2em}mark{color:#000;background:#ff0}small{font-size:80%}sub,sup{position:relative;font-size:75%;line-height:0;vertical-align:baseline}sup{top:-.5em}sub{bottom:-.25em}svg:not(:root){overflow:hidden}figure{margin:1em 40px}hr{height:0;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box}pre,textarea{overflow:auto}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}button,input,optgroup,select,textarea{margin:0;font:inherit;color:inherit}button{overflow:visible}button,select{text-transform:none}button,html input[type=button],input[type=reset],input[type=submit]{-webkit-appearance:button;cursor:pointer}button[disabled],html input[disabled]{cursor:default}button::-moz-focus-inner,input::-moz-focus-inner{padding:0;border:0}input{line-height:normal}input[type=checkbox],input[type=radio]{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:0}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{height:auto}input[type=search]{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;-webkit-appearance:textfield}input[type=search]::-webkit-search-cancel-button,input[type=search]::-webkit-search-decoration{-webkit-appearance:none}fieldset{padding:.35em .625em .75em;margin:0 2px;border:1px solid silver}table{border-spacing:0;border-collapse:collapse}.pull-left{float:left}.desc-heading_foot{position:relative;margin-bottom:0;margin-top:6px;top:6px}.desc-heading-name{display:inline-block!important;overflow:hidden;float:left;width:100%}.a_new_display_toggle{display:none}.a_all_integration_information{margin-top:15px;width:75%;display:none}.a_font_small_chap{font-size:12px}.a_cursor_pointer_a{cursor:pointer}.a_right_icon_not_complate{height:25px;width:25px;float:right;margin-right:20px;color:red}.a_hover_text_not_complete{position:absolute;display:none;top:-20px;right:50px}h4.desc-heading_foot{float:left;font-size:12px;font-weight:300;margin:-3px 0 0;width:100%;overflow:hidden}.pull-left.icon{border-radius:50%;overflow:hidden;width:58px;height:58px;margin:4px;z-index:10;position:relative}.alert-widget .icon img{width:100%}.alert-widget-8 .desc.desc_live_preview .desc-heading{margin-top:2px}.alert-widget-8 .desc.desc_live_preview{padding-left:72px;padding-right:20px}.alert-widget-5 .desc.desc_live_preview{padding-left:70px;padding-top:7px;border-radius:40px}.alert-widget-6 .icon{margin:6px!important}.alert-widget-7 .desc.desc_live_preview{padding-right:30px!important;padding-left:67px!important}.provely-widget .desc.desc_live_preview{float:left;line-height:17px;margin-top:0;position:absolute;left:0;top:0;padding:5px 9px 0 74px;width:100%;max-width:318px;height:70px}.alert-widget{font-family:Poppins,sans-serif;border:0;display:inline-block;padding:0;margin:0 auto 20px;background:0 0;width:318px;height:70px!important;position:relative;left:80px;bottom:-20px}.alert-widget-6 .desc:before,.alert-widget-7 .desc:before{content:"";display:block;height:10px}.alert-widget .icon{margin:-2px 15px -2px -2px}.alert-widget .icon img{max-width:64px}.alert-widget .desc{float:r;position:relative}.alert-widget .desc-heading{line-height:20px;margin-top:8px;font-weight:600;margin-bottom:0;float:left;width:100%;border:0;display:block;font-size:15px;font-family:Poppins,sans-serif!important}.alert-widget .desc-heading small{display:block;color:#000;position:relative;width:100%;border:0;font-size:inherit;text-align:left;margin:0;top:0;font-weight:600}.alert-widget .desc .time{color:#909090;font-size:11px;position:relative;margin-top:8px;float:left;width:auto;font-weight:300}.alert-widget-1{border:0;box-shadow:5px 5px 15px rgba(0,0,0,.2);border-radius:5px}.alert-widget-1 .icon{max-width:62px;border-radius:5px;overflow:hidden;margin:6px}.alert-widget-2{padding-bottom:5px}.alert-widget-3 .desc_live_preview{border-radius:2px;box-shadow:35px 0 0 rgba(0,0,0,.2) inset}.alert-widget-3 .icon{max-width:62px;border-radius:50%;overflow:hidden}.alert-widget-4{border:0;padding:0;background:0 0}.alert-widget-4 .desc{box-shadow:0 0 30px rgba(0,0,0,.2);background:#fff;padding:8px 30px 5px;border-radius:80px}.alert-widget-4 .icon{margin:6px!important}.alert-widget-4 .icon img{max-width:70px;border-radius:50%;padding:0;box-shadow:0 0 20px rgba(0,0,0,.2);top:0}.alert-widget-4 span.poweredby,.alert-widget-5 span.poweredby{margin-right:15px}.alert-widget-5{border:0;border-radius:60px;padding-right:30px}.alert-widget-5 .desc_live_preview{box-shadow:0 0 45px rgba(0,0,0,.6) inset;border-radius:60px!important}.alert-widget-5 .icon{max-width:62px;border-radius:50%;overflow:hidden}.alert-widget-6{border:0;padding:0;background:0 0}.alert-widget-6 .desc{border:2px solid #d5d5d5;background:#fff;padding:8px 12px 5px}.alert-widget-6 .desc:before{width:12px;position:absolute;left:-12px;top:-2px;background:url(../images/tip-1.png) center no-repeat}.alert-widget-6 .icon{margin-right:25px}.alert-widget-6 .icon img{max-width:70px}.alert-widget-7{border:0;padding:0;background:0 0}.alert-widget-7 .desc{border:2px solid #d5d5d5;background:#fff;padding:8px 30px 5px;border-radius:80px}.alert-widget-7 .desc:before{width:9px;position:absolute;left:-9px;top:41%;background:url(../images/tip-2.png) center no-repeat}.alert-widget-7 .icon img{width:58px;height:58px;border-radius:50%;padding:4px;border:1px solid #d5d5d5}.alert-widget-10,.alert-widget-9{box-shadow:0 0 30px rgba(0,0,0,.2);padding-right:30px}.alert-widget-8{overflow:hidden;border-radius:5px;-webkit-transform:skew(-190deg);-moz-transform:skew(-190deg);transform:skew(-190deg)}.alert-widget-8 .desc,.alert-widget-8 .icon img{-webkit-transform:skew(-170deg);-moz-transform:skew(-170deg);transform:skew(-170deg)}.alert-widget-8 .icon{border-radius:5px;overflow:hidden;background:#904bcb;margin:4px}.alert-widget-9{border:0;border-radius:5px;-webkit-transform:skew(-170deg);-moz-transform:skew(-170deg);transform:skew(-170deg)}.alert-widget-9 .desc,.alert-widget-9 .icon{-webkit-transform:skew(-190deg);-moz-transform:skew(-190deg);transform:skew(-190deg)}.alert-widget-9 .desc-heading{margin-top:6px}.alert-widget-9 .icon{max-width:62px;border-radius:50%;overflow:hidden;margin:6px 10px}.alert-widget-10{border:0;border-radius:1px}.alert-widget-10 .desc-heading{margin-top:6px}.alert-widget-10 .icon{max-width:62px;overflow:hidden;margin:5px 7px}.alert-widget-2 .icon,.alert-widget-3 .icon,.alert-widget-5 .icon,.alert-widget-7 .icon{margin:6px 4px}.wizard-widgetList.right{width:360px}span.desc-heading-name{display:inline-block!important;overflow:hidden;float:left;width:100%;font-family:Poppins,sans-serif;font-size:12px;line-height:1}.desc.desc_live_preview{float:left;line-height:17px;margin-top:0;position:absolute;left:0;top:0;height:100%;padding:5px 9px 0 74px;width:100%}.wizard-widgetList li{padding:0 0 0 20px}.provely-widget span.poweredby{float:right;margin-top:8px;font-size:9px;text-decoration:none;color:#9c9c9c}.provely-widget span.poweredby i{color:#3498db;margin-right:3px}.provely-widget span.poweredby a{font-weight:600;text-decoration:none;margin-left:3px;color:#3498db}.provely-widget span.poweredby a:hover{text-decoration:underline}@media screen and (max-width:568px){.provely-widget.alert-widget{bottom:20px!important;left:30px!important;margin:0!important;position:fixed!important;width:100%!important;max-width:320px!important}.provely-widget.alert-widget .desc_live_preview{width:100%!important;max-width:100%!important}}@media screen and (max-width:320px){.provely-widget.alert-widget{bottom:0!important;left:0!important;margin:0!important;position:fixed!important;width:100%!important;max-width:320px!important}.provely-widget.alert-widget .desc_live_preview{width:100%!important;max-width:100%!important}}</style>');
                        $provelyIframe.contents().find('head').append('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">');
                        $provelyIframe.contents().find('head').append('<style> body { margin: 0px; padding: 0px; }</style>');

                        var html = '';
                        var campaignConfig = provely.config;

                        if (provely.config.show_counters == 1)
                            {
                                console.log('Display counter');

                                html += '<div class="provely-widget alert-widget alert-widget-4">';
                                html +=        '<div class="pull-left icon">';
                                html +=             '<img class="live_preview_image" src="' + provely.config.baseUrl + 'images/ico-7.png' + '" alt="" style="background: rgb(255, 255, 255);">';
                                html +=        '</div>';
                                html +=        '<div class="desc desc_live_preview" style="background: rgb(255, 255, 255);">';
                                html +=            '<h4 class="desc-heading">';
                                html +=                '<small>';
                                html +=                    '<span class="desc-heading-name" style="color:' + campaignConfig['name_color'] + '; margin-top: 13px;">';
                                html +=                        campaignConfig['counter_text'];
                                html +=                    '</span>';
                                html +=                '</small>';
                                html +=            '</h4>';

                                // Disable counter. Only display once.
                                provely.config.show_counters = 0;

                            } else {
                                var contact = provely.data.contacts[provely.data.seenCount];
                                console.log('displaying widget');

                                html += '<div class="provely-widget alert-widget alert-widget-'+ campaignConfig['template'] +'">';
                                html +=        '<div class="pull-left icon">';
                                                if (contact.avatar !== undefined)
                                                {
                                                    html += '<img class="live_preview_image" src=" ' + (contact.avatar ? contact.avatar : provely.config.baseUrl + 'images/ico-7.png')+ '" alt="" style="background: rgb(255, 255, 255);">';
                                                } else
                                                {
                                                    html += '<div id="map" style="width: 62px !important; height: 82px !important;"></div>';
                                                }
                                html +=        '</div>';
                                html +=        '<div class="desc desc_live_preview" style="background: rgb(255, 255, 255);">';
                                html +=            '<h4 class="desc-heading">';
                                html +=                '<small>';
                                html +=                    '<span class="desc-heading-name" style="color:' + campaignConfig['name_color'] + '">';
                                html +=                        contact['header'];
                                html +=                    '</span>';
                                html +=                '</small>';
                                html +=            '</h4>';
                                html +=            '<h4 class="desc-heading_foot"  style="color: ' + campaignConfig['message_color'] + '"> ' + contact['text'] + '</h4>';
                                html +=            '<span class="time" style="color: ' + campaignConfig['time_color'] + '">' + contact['diff'] + '</span>';

                                // Increment the number of contacts seen.
                                provely.data.seenCount++;
                            }

                           if ( campaignConfig['branding'] )
                            {
                            html +=          '<span href="https://provely.io" target="_blank" class="poweredby"><i class="fa fa-plug"></i>by<a href="https://www.scrum-institute.org" target="_blank">Scrum Institute™</a></span>';
                            }

                            // Close widget/counter div.
                            html +=        '</div>';
                            html += '</div>';

                            // If sound, then just append it after the widget/counter div.
                            if (campaignConfig['sound'])
                            {
                                html += '<div style="display: none;">';
                                html += '<audio controls autoplay volume="0.1" class="not_sound" id="player"><source src="' + provely.config.baseUrl + '/sounds/' + campaignConfig['sound'] + '" type="audio/ogg; codecs=vorbis"></audio>';
                                html += '</div>';
                            }

                            //html += '<script> window.onload = function() { document.getElementsByTagName("body")[0].style.background = "red"; }; </script>';

                            // Inject html into iframe.
                            $provelyIframe.contents().find("body").append(html);

                            switch (provely.config.location)
                            {
                                case 'bottom-right':
                                    $pv('#provely-widget').css('bottom', 55).css('right', 40);
                                    break;

                                case 'top-left':
                                    $pv('#provely-widget').css('top', 55).css('left', 40);
                                    break;

                                case 'top-right':
                                    $pv('#provely-widget').css('top', 55).css('right', 40);
                                    break;

                                case 'bottom-left':
                                default:
                                    $pv('#provely-widget').css('bottom', 55).css('left', 40);
                                    break;
                            }

                            //$provelyIframe.on('load', function(){
                            //    console.log('iframe ONLOAD');
                                $pv('#provely-widget').css('opacity', 1);

                                if (provely.config.effect != 'none')
                                {
                                    $pv('#provely-widget').css('opacity', 0);
                                    provely.provelyAnimate(provely.config.effect);
                                }

                                setTimeout(function(){
                                    provely.removeWidget();
                                }, 10000);
                            //});
                    });

                //}, 50);


            }


        },

        removeWidget: function()
        {
            $pv('#provely-widget').remove();

            setTimeout(function(){
                provely.displayWidget();
            }, provely.config.delay * 1000);
        },

        provelyAnimate: function(x)
        {
            $pv('#provely-widget').removeClass().addClass(x + ' animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                // $pv(this).removeClass();
                // $pv(this).css('opacity', 1);
            });
        },

        mobilecheck: function() {
            var check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
            return check;
        },

        hidden: null, visibilityChange: null,

        handleVisibilityChange: function() {
            if (document[hidden]) {
                provely.config.show = 0;
            } else {
                provely.config.show = 1;
            }
        },


        init : function()
        {
            // load latest jquery
            var script = document.createElement("SCRIPT");
            script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js';
            script.type = 'text/javascript';
            script.onload = function() {
                provely.jqLoad();
            };
            document.getElementsByTagName("head")[0].appendChild(script);

            if (typeof document.hidden !== "undefined") {
                hidden = "hidden";
                visibilityChange = "visibilitychange";
            } else if (typeof document.mozHidden !== "undefined") {
                hidden = "mozHidden";
                visibilityChange = "mozvisibilitychange";
            } else if (typeof document.msHidden !== "undefined") {
                hidden = "msHidden";
                visibilityChange = "msvisibilitychange";
            } else if (typeof document.webkitHidden !== "undefined") {
                hidden = "webkitHidden";
                visibilityChange = "webkitvisibilitychange";
            }

            document.addEventListener(visibilityChange, provely.handleVisibilityChange, false);
        }
    }

    window.addEventListener('load', provely.init);

})();