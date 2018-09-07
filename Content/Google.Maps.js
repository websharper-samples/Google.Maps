// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
(function()
{
 "use strict";
 var Global,WebSharper,Google,Maps,Tests,SamplesInternals,Obj,Html,Client,Pagelet,Tags,Operators,EventTarget,Node,TagBuilder,google,maps,MVCObject,AttributeBuilder,Attr,Element,Unchecked,Arrays,WindowOrWorkerGlobalScope,SC$1,Text,Operators$1,Object,Implementation,JQueryHtmlProvider,DeprecatedTagBuilder,Attribute,Enumerator,T,event,Math,MapTypeId,TravelMode,DirectionsStatus,IntelliFactory,Runtime;
 Global=self;
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 Google=WebSharper.Google=WebSharper.Google||{};
 Maps=Google.Maps=Google.Maps||{};
 Tests=Maps.Tests=Maps.Tests||{};
 SamplesInternals=Tests.SamplesInternals=Tests.SamplesInternals||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 Html=WebSharper.Html=WebSharper.Html||{};
 Client=Html.Client=Html.Client||{};
 Pagelet=Client.Pagelet=Client.Pagelet||{};
 Tags=Client.Tags=Client.Tags||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 EventTarget=Global.EventTarget;
 Node=Global.Node;
 TagBuilder=Client.TagBuilder=Client.TagBuilder||{};
 google=Global.google;
 maps=google&&google.maps;
 MVCObject=maps&&maps.MVCObject;
 AttributeBuilder=Client.AttributeBuilder=Client.AttributeBuilder||{};
 Attr=Client.Attr=Client.Attr||{};
 Element=Client.Element=Client.Element||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 SC$1=Global.StartupCode$WebSharper_Html_Client$Html=Global.StartupCode$WebSharper_Html_Client$Html||{};
 Text=Client.Text=Client.Text||{};
 Operators$1=Client.Operators=Client.Operators||{};
 Object=Global.Object;
 Implementation=Client.Implementation=Client.Implementation||{};
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Implementation.JQueryHtmlProvider||{};
 DeprecatedTagBuilder=Client.DeprecatedTagBuilder=Client.DeprecatedTagBuilder||{};
 Attribute=Client.Attribute=Client.Attribute||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 T=Enumerator.T=Enumerator.T||{};
 event=maps&&maps.event;
 Math=Global.Math;
 MapTypeId=maps&&maps.MapTypeId;
 TravelMode=maps&&maps.TravelMode;
 DirectionsStatus=maps&&maps.DirectionsStatus;
 IntelliFactory=Global.IntelliFactory;
 Runtime=IntelliFactory&&IntelliFactory.Runtime;
 SamplesInternals.Samples=function()
 {
  var a,a$1;
  (a=[(a$1=[Tags.Tags().text("Google Maps Samples")],Tags.Tags().NewTag("h1",a$1)),SamplesInternals.SimpleMap(),SamplesInternals.PanTo(),SamplesInternals.RandomMarkers(),SamplesInternals.InfoWindow(),SamplesInternals.Controls(),SamplesInternals.SimpleDirections(),SamplesInternals.DirectionsWithWaypoints(),SamplesInternals.SimplePolygon(),SamplesInternals.PrimitiveEvent(),SamplesInternals.SimplePolyline()],Tags.Tags().NewTag("div",a)).AppendTo("main");
 };
 SamplesInternals.SimpleMap=function()
 {
  return SamplesInternals.Sample("Simple map",function(map)
  {
   map.setOptions({
    center:new maps.LatLng(-34.397,150.644),
    zoom:8
   });
  });
 };
 SamplesInternals.PanTo=function()
 {
  return SamplesInternals.Sample("Pan after timeout",function(map)
  {
   map.setOptions({
    center:new maps.LatLng(37.4419,-122.1419),
    zoom:8
   });
   Global.setTimeout(function()
   {
    map.panTo(new maps.LatLng(37.4569,-122.1569));
   },5000);
  });
 };
 SamplesInternals.RandomMarkers=function()
 {
  return SamplesInternals.Sample("Random markers",function(map)
  {
   event.addListener(map,"bounds_changed",function()
   {
    var bounds,sw,ne,lngSpan,latSpan,i,$1;
    function rnd()
    {
     return Math.random();
    }
    bounds=map.getBounds();
    sw=bounds.getSouthWest();
    ne=bounds.getNorthEast();
    lngSpan=ne.lng()-sw.lng();
    latSpan=ne.lat()-sw.lat();
    for(i=1,$1=10;i<=$1;i++)new maps.Marker({
     position:new maps.LatLng(sw.lat()+latSpan*rnd(),sw.lng()+lngSpan*rnd()),
     map:map
    });
   });
  });
 };
 SamplesInternals.InfoWindow=function()
 {
  return SamplesInternals.Sample("Info window",function(map)
  {
   var center,a;
   center=map.getCenter();
   (new maps.InfoWindow({
    content:(a=[Tags.Tags().text("Hello World")],Tags.Tags().NewTag("span",a)).get_Body(),
    position:center
   })).open(map);
  });
 };
 SamplesInternals.Controls=function()
 {
  return SamplesInternals.Sample("Hide default controls",function(map)
  {
   map.setOptions({
    center:new maps.LatLng(37.4419,-122.1419),
    zoom:8,
    disableDefaultUI:true
   });
  });
 };
 SamplesInternals.SimpleDirections=function()
 {
  return SamplesInternals.Sample("Simple directions",function(map)
  {
   var directionsService,directionsDisplay,mapDiv,dirPanel,a,_this,a$1;
   directionsService=new maps.DirectionsService();
   directionsDisplay=new maps.DirectionsRenderer();
   map.setCenter(new maps.LatLng(41.850033,-87.6500523));
   map.setZoom(7);
   map.setMapTypeId(MapTypeId.ROADMAP);
   directionsDisplay.setMap(map);
   mapDiv=map.getDiv();
   dirPanel=(a=[Attr.Attr().NewAttr("name","directionsDiv")],Tags.Tags().NewTag("div",a));
   _this=Global.jQuery(mapDiv);
   a$1=dirPanel.Dom;
   _this.after.apply(_this,[a$1]);
   directionsDisplay.setPanel(dirPanel.Dom);
   directionsService.route({
    origin:"chicago, il",
    destination:"st louis, mo",
    travelMode:TravelMode.DRIVING
   },function($1,$2)
   {
    if(Unchecked.Equals($2,DirectionsStatus.OK))
     directionsDisplay.setDirections($1);
   });
  });
 };
 SamplesInternals.DirectionsWithWaypoints=function()
 {
  return SamplesInternals.Sample("Directions with waypoints",function(map)
  {
   var directionsService,directionsDisplay,mapDiv,dirPanel,a,_this,a$1;
   directionsService=new maps.DirectionsService();
   directionsDisplay=new maps.DirectionsRenderer();
   map.setCenter(new maps.LatLng(41.850033,-87.6500523));
   map.setZoom(7);
   map.setMapTypeId(MapTypeId.ROADMAP);
   directionsDisplay.setMap(map);
   mapDiv=map.getDiv();
   dirPanel=(a=[Attr.Attr().NewAttr("name","directionsDiv")],Tags.Tags().NewTag("div",a));
   _this=Global.jQuery(mapDiv);
   a$1=dirPanel.Dom;
   _this.after.apply(_this,[a$1]);
   directionsDisplay.setPanel(dirPanel.Dom);
   directionsService.route({
    origin:"chicago, il",
    destination:"st louis, mo",
    travelMode:TravelMode.DRIVING,
    waypoints:Arrays.map(function(x)
    {
     return{
      location:x
     };
    },["champaign, il","decatur, il"])
   },function($1,$2)
   {
    if(Unchecked.Equals($2,DirectionsStatus.OK))
     directionsDisplay.setDirections($1);
   });
  });
 };
 SamplesInternals.SimplePolygon=function()
 {
  return SamplesInternals.Sample("Simple polygon",function(map)
  {
   var polygon;
   map.setCenter(new maps.LatLng(37.4419,-122.1419));
   map.setZoom(13);
   polygon=new maps.Polygon();
   polygon.setPath([new maps.LatLng(37.4419,-122.1419),new maps.LatLng(37.4519,-122.1519),new maps.LatLng(37.4419,-122.1319),new maps.LatLng(37.4419,-122.1419)]);
   polygon.setMap(map);
  });
 };
 SamplesInternals.PrimitiveEvent=function()
 {
  return SamplesInternals.Sample("Simple event handler",function(map)
  {
   event.addListener(map,"click",function()
   {
    return Global.alert("Map Clicked!");
   });
  });
 };
 SamplesInternals.SimplePolyline=function()
 {
  return SamplesInternals.Sample("Simple polyline",function(map)
  {
   new maps.Polyline({
    strokeColor:"#ff0000",
    path:[new maps.LatLng(37.4419,-122.1419),new maps.LatLng(37.5419,-122.2419)],
    map:map
   });
  });
 };
 SamplesInternals.Sample=function(name,buildMap)
 {
  var a,a$1,x,a$2;
  function f(mapElement)
  {
   var options;
   options={
    center:new maps.LatLng(37.4419,-122.1419),
    zoom:8
   };
   buildMap(new maps.Map(mapElement.get_Body(),options));
  }
  a=[(a$1=[Tags.Tags().text(name)],Tags.Tags().NewTag("h1",a$1)),(x=(a$2=[Attr.Attr().NewAttr("style","padding-bottom:20px; width:500px; height:300px;")],Tags.Tags().NewTag("div",a$2)),(function(w)
  {
   Operators$1.OnAfterRender(f,w);
  }(x),x))];
  return Tags.Tags().NewTag("div",a);
 };
 Obj=WebSharper.Obj=Runtime.Class({
  Equals:function(obj)
  {
   return this===obj;
  }
 },null,Obj);
 Obj.New=Runtime.Ctor(function()
 {
 },Obj);
 Pagelet=Client.Pagelet=Runtime.Class({
  AppendTo:function(targetId)
  {
   self.document.getElementById(targetId).appendChild(this.get_Body());
   this.Render();
  },
  Render:Global.ignore
 },Obj,Pagelet);
 Pagelet.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },Pagelet);
 Tags.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags$1;
 };
 Operators.FailWith=function(msg)
 {
  throw new Global.Error(msg);
 };
 TagBuilder=Client.TagBuilder=Runtime.Class({
  text:function(data)
  {
   return new Text.New(data);
  },
  NewTag:function(name,children)
  {
   var el,e;
   el=Element.New(this.HtmlProvider,name);
   e=Enumerator.Get(children);
   try
   {
    while(e.MoveNext())
     el.AppendI(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
   return el;
  }
 },Obj,TagBuilder);
 TagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },TagBuilder);
 AttributeBuilder=Client.AttributeBuilder=Runtime.Class({
  NewAttr:function(name,value)
  {
   return Attribute.New(this.HtmlProvider,name,value);
  }
 },Obj,AttributeBuilder);
 AttributeBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },AttributeBuilder);
 Attr.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr$1;
 };
 Element=Client.Element=Runtime.Class({
  get_Body:function()
  {
   return this.Dom;
  },
  Render:function()
  {
   if(!this.IsRendered)
    {
     this.RenderInternal();
     this.IsRendered=true;
    }
  },
  AppendI:function(pl)
  {
   var body,r;
   body=pl.get_Body();
   body.nodeType===2?this.HtmlProvider.AppendAttribute(this.get_Body(),body):this.HtmlProvider.AppendNode(this.get_Body(),pl.get_Body());
   this.IsRendered?pl.Render():(r=this.RenderInternal,this.RenderInternal=function()
   {
    r();
    pl.Render();
   });
  }
 },Pagelet,Element);
 Element.New=function(html,name)
 {
  var el,dom;
  el=new Element.New$1(html);
  dom=self.document.createElement(name);
  el.RenderInternal=Global.ignore;
  el.Dom=dom;
  el.IsRendered=false;
  return el;
 };
 Element.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Element);
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 SC$1.$cctor=function()
 {
  SC$1.$cctor=Global.ignore;
  SC$1.HtmlProvider=new JQueryHtmlProvider.New();
  SC$1.Attr=new AttributeBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags=new TagBuilder.New(Implementation.HtmlProvider());
  SC$1.DeprecatedHtml=new DeprecatedTagBuilder.New(Implementation.HtmlProvider());
  SC$1.Tags$1=Implementation.Tags();
  SC$1.Deprecated=Implementation.DeprecatedHtml();
  SC$1.Attr$1=Implementation.Attr();
 };
 Text=Client.Text=Runtime.Class({
  get_Body:function()
  {
   return self.document.createTextNode(this.text);
  }
 },Pagelet,Text);
 Text.New=Runtime.Ctor(function(text)
 {
  Pagelet.New.call(this);
  this.text=text;
 },Text);
 Operators$1.OnAfterRender=function(f,w)
 {
  var r;
  r=w.Render;
  w.Render=function()
  {
   r.apply(w);
   f(w);
  };
 };
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 JQueryHtmlProvider=Implementation.JQueryHtmlProvider=Runtime.Class({
  AppendAttribute:function(node,attr)
  {
   this.SetAttribute(node,attr.nodeName,attr.value);
  },
  AppendNode:function(node,el)
  {
   var _this,a;
   _this=Global.jQuery(node);
   a=Global.jQuery(el);
   _this.append.apply(_this,[a]);
  },
  SetAttribute:function(node,name,value)
  {
   Global.jQuery(node).attr(name,value);
  },
  CreateAttribute:function(str)
  {
   return self.document.createAttribute(str);
  }
 },Obj,JQueryHtmlProvider);
 JQueryHtmlProvider.New=Runtime.Ctor(function()
 {
  Obj.New.call(this);
 },JQueryHtmlProvider);
 Implementation.HtmlProvider=function()
 {
  SC$1.$cctor();
  return SC$1.HtmlProvider;
 };
 Implementation.Tags=function()
 {
  SC$1.$cctor();
  return SC$1.Tags;
 };
 Implementation.DeprecatedHtml=function()
 {
  SC$1.$cctor();
  return SC$1.DeprecatedHtml;
 };
 Implementation.Attr=function()
 {
  SC$1.$cctor();
  return SC$1.Attr;
 };
 DeprecatedTagBuilder=Client.DeprecatedTagBuilder=Runtime.Class({},Obj,DeprecatedTagBuilder);
 DeprecatedTagBuilder.New=Runtime.Ctor(function(HtmlProvider)
 {
  Obj.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },DeprecatedTagBuilder);
 Attribute=Client.Attribute=Runtime.Class({
  get_Body:function()
  {
   var attr;
   attr=this.HtmlProvider.CreateAttribute(this.Name);
   attr.value=this.Value;
   return attr;
  }
 },Pagelet,Attribute);
 Attribute.New=function(htmlProvider,name,value)
 {
  var a;
  a=new Attribute.New$1(htmlProvider);
  a.Name=name;
  a.Value=value;
  return a;
 };
 Attribute.New$1=Runtime.Ctor(function(HtmlProvider)
 {
  Pagelet.New.call(this);
  this.HtmlProvider=HtmlProvider;
 },Attribute);
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 T=Enumerator.T=Runtime.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T);
 T.New=Runtime.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T);
 Runtime.OnLoad(function()
 {
  SamplesInternals.Samples();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
