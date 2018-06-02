webpackJsonp([0],{188:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!==typeof t&&"function"!==typeof t?e:t}function s(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var i,l,u,c,d,p=function(){function e(e,t){for(var a=0;a<t.length;a++){var n=t[a];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,a,n){return a&&e(t.prototype,a),n&&e(t,n),t}}(),f=a(0),m=n(f),h=a(4),b=n(h),y=a(24),v=a(509),g=n(v),T=a(35),w=a(18),E=a(2317),S=n(E),x=a(2360),R=n(x),k=a(36),M=a(2362),O=n(M),_=0,C=1,P=2,j=3,A=(0,w.defineMessages)({set:{id:"activitiesTab.Set",defaultMessage:"Result Setting"},finalize:{id:"str.finalize",defaultMessage:"Finalize"},withdraw:{id:"str.withdraw",defaultMessage:"Withdraw"},history:{id:"activitiesTab.History",defaultMessage:"Activities History"}}),B=(i=(0,T.withStyles)(O.default,{withTheme:!0}),l=(0,y.connect)(function(e){return Object.assign({},e.App.toJS(),{actionableItemCount:e.Graphql.get("actionableItemCount")})}),(0,w.injectIntl)(u=i(u=l((d=c=function(e){function t(e){r(this,t);var a=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e)),n=void 0;switch(a.props.match.path){case k.RouterPath.set:n=_;break;case k.RouterPath.finalize:n=C;break;case k.RouterPath.withdraw:n=P;break;case k.RouterPath.activityHistory:n=j}return a.state={tabIdx:n},a.getTabLabel=a.getTabLabel.bind(a),a.handleTabChange=a.handleTabChange.bind(a),a}return s(t,e),p(t,[{key:"render",value:function(){var e=this.props,t=e.classes,a=e.history,n=this.state.tabIdx;return m.default.createElement("div",null,m.default.createElement(g.default,{indicatorColor:"primary",value:n,onChange:this.handleTabChange,className:t.activitiesTabWrapper},m.default.createElement(v.Tab,{label:this.getTabLabel(k.EventStatus.Set)}),m.default.createElement(v.Tab,{label:this.getTabLabel(k.EventStatus.Finalize)}),m.default.createElement(v.Tab,{label:this.getTabLabel(k.EventStatus.Withdraw)}),m.default.createElement(v.Tab,{label:this.props.intl.formatMessage(A.history)})),m.default.createElement("div",{className:t.activitiesTabContainer},n===_&&m.default.createElement(S.default,{eventStatusIndex:k.EventStatus.Set}),n===C&&m.default.createElement(S.default,{eventStatusIndex:k.EventStatus.Finalize}),n===P&&m.default.createElement(S.default,{eventStatusIndex:k.EventStatus.Withdraw}),n===j&&m.default.createElement(R.default,{history:a})))}},{key:"getTabLabel",value:function(e){var t=this.props,a=t.actionableItemCount,n=t.intl,r=void 0,o=void 0;switch(e){case k.EventStatus.Set:r=n.formatMessage(A.set),o=a[k.EventStatus.Set];break;case k.EventStatus.Finalize:r=n.formatMessage(A.finalize),o=a[k.EventStatus.Finalize];break;case k.EventStatus.Withdraw:r=n.formatMessage(A.withdraw),o=a[k.EventStatus.Withdraw]}var s="";return o>0&&(s=" ("+o+")"),""+r+s}},{key:"handleTabChange",value:function(e,t){switch(t){case _:this.props.history.push(k.RouterPath.set);break;case C:this.props.history.push(k.RouterPath.finalize);break;case P:this.props.history.push(k.RouterPath.withdraw);break;case j:this.props.history.push(k.RouterPath.activityHistory);break;default:throw new Error("Invalid tab index: "+t)}}}]),t}(f.Component),c.propTypes={intl:w.intlShape.isRequired,match:b.default.object.isRequired,history:b.default.object.isRequired,classes:b.default.object.isRequired,actionableItemCount:b.default.object},c.defaultProps={actionableItemCount:void 0},u=d))||u)||u)||u);t.default=B},2314:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){return{txidLabel:{width:"150px"},txidRow:{position:"relative",height:"85px"},txidWrapper:{position:"absolute",left:"24px",top:"4px",bottom:"4px",right:"24px",paddingTop:"18px"},txIdText:{"&:hover":{color:"#585AFA",cursor:"pointer"},textDecoration:"underline"}}};t.default=n},2315:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var r=a(0),o=n(r),s=a(4),i=n(s),l=a(27),u=a(18),c=a(2314),d=n(c),p=a(134),f=n(p),m=function(e){var t=e.classes,a=e.transaction;return o.default.createElement(l.TableCell,{padding:"dense",className:t.txidRow},o.default.createElement("div",{className:t.txidWrapper},o.default.createElement("div",{className:t.txidLabel},o.default.createElement(u.FormattedMessage,{id:"str.transactionId",defaultMessage:"Transaction ID"})),o.default.createElement("div",{className:t.txIdText,onClick:function(e){e.stopPropagation(),window.open(f.default.explorer.tx+"/"+a.txid,"_blank")}},a.txid)))};m.propTypes={classes:i.default.object.isRequired,transaction:i.default.object.isRequired},t.default=(0,u.injectIntl)((0,l.withStyles)(d.default,{withTheme:!0})(m))},2316:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var r=a(0),o=n(r),s=a(4),i=n(s),l=a(285),u=a(18),c=a(35),d=a(2314),p=n(d),f=function(e){var t=e.classes,a=e.transaction;return o.default.createElement(l.TableCell,{padding:"dense",className:t.txidRow},o.default.createElement("div",{className:t.txidWrapper},o.default.createElement("div",{className:t.txidLabel},o.default.createElement(u.FormattedMessage,{id:"str.addressUsed",defaultMessage:"Address Used"})),o.default.createElement("div",null,a.senderAddress)))};f.propTypes={classes:i.default.object.isRequired,transaction:i.default.object.isRequired},t.default=(0,u.injectIntl)((0,c.withStyles)(p.default,{withTheme:!0})(f))},2317:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function s(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!==typeof t&&"function"!==typeof t?e:t}function i(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var l,u,c,d,p,f=function(){function e(e,t){for(var a=0;a<t.length;a++){var n=t[a];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,a,n){return a&&e(t.prototype,a),n&&e(t,n),t}}(),m=a(0),h=n(m),b=a(4),y=n(b),v=a(24),g=a(26),T=n(g),w=a(35),E=a(18),S=a(2318),x=n(S),R=a(36),k=a(45),M=n(k),O=a(84),_=n(O),C=a(2319),P=n(C),j=a(2321),A=n(j),B=a(2323),L=n(B),q=(0,E.defineMessages)({placeBet:{id:"bottomButtonText.placeBet",defaultMessage:"Place Bet"},setResult:{id:"str.setResult",defaultMessage:"Set Result"},arbitrate:{id:"bottomButtonText.arbitrate",defaultMessage:"Arbitrate"},finalizeResult:{id:"str.finalizeResult",defaultMessage:"Finalize Result"},withdraw:{id:"str.withdraw",defaultMessage:"Withdraw"}}),N=R.TransactionStatus.Pending,z=50,F=(l=(0,w.withStyles)(x.default,{withTheme:!0}),u=(0,v.connect)(function(e){return{topics:e.Graphql.get("getTopicsReturn"),oracles:e.Graphql.get("getOraclesReturn"),sortBy:e.Dashboard.get("sortBy"),syncBlockNum:e.App.get("syncBlockNum"),walletAddresses:e.App.get("walletAddresses")}},function(e){return{setAppLocation:function(t){return e(M.default.setAppLocation(t))},getActionableTopics:function(t,a,n,r){return e(_.default.getActionableTopics(t,a,n,r))},getOracles:function(t,a,n,r){return e(_.default.getOracles(t,a,n,r))}}}),(0,E.injectIntl)(c=l(c=u((p=d=function(e){function t(){var e,a,n,i;o(this,t);for(var l=arguments.length,u=Array(l),c=0;c<l;c++)u[c]=arguments[c];return a=n=s(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),n.state={skip:0},n.loadMoreData=function(){var e=n.state.skip,t=n.props,a=t.eventStatusIndex,r=t.sortBy,o=t.walletAddresses;e+=z,n.executeGraphRequest(a,r,z,e,o),n.setState({skip:e})},n.setAppLocation=function(e){var t,a=(t={},r(t,R.EventStatus.Bet,R.AppLocation.qtumPrediction),r(t,R.EventStatus.Set,R.AppLocation.resultSet),r(t,R.EventStatus.Vote,R.AppLocation.botCourt),r(t,R.EventStatus.Finalize,R.AppLocation.finalize),r(t,R.EventStatus.Withdraw,R.AppLocation.withdraw),t);n.props.setAppLocation(a[e])},i=a,s(n,i)}return i(t,e),f(t,[{key:"componentWillMount",value:function(){var e=this.props,t=e.eventStatusIndex,a=e.sortBy,n=e.walletAddresses;this.setAppLocation(t),this.executeGraphRequest(t,a,z,0,n)}},{key:"componentWillReceiveProps",value:function(e){var t=e.eventStatusIndex,a=e.sortBy,n=e.syncBlockNum,r=e.walletAddresses;if(t!==this.props.eventStatusIndex||a!==this.props.sortBy||n!==this.props.syncBlockNum||r!==this.props.walletAddresses){var o=r||this.props.walletAddresses;this.executeGraphRequest(t,a,z,0,o),this.setState({skip:0})}}},{key:"executeGraphRequest",value:function(e,t,a,n,r){var o=this.props,s=o.getActionableTopics,i=o.getOracles,l=t||R.SortBy.Ascending;switch(e){case R.EventStatus.Bet:i([{token:R.Token.Qtum,status:R.OracleStatus.Voting},{token:R.Token.Qtum,status:R.OracleStatus.Created}],{field:"endTime",direction:l},a,n);break;case R.EventStatus.Set:var u=[{token:R.Token.Qtum,status:R.OracleStatus.OpenResultSet}];T.default.each(r,function(e){u.push({token:R.Token.Qtum,status:R.OracleStatus.WaitResult,resultSetterQAddress:e.address})}),i(u,{field:"resultSetEndTime",direction:l},a,n);break;case R.EventStatus.Vote:i([{token:R.Token.Bot,status:R.OracleStatus.Voting}],{field:"endTime",direction:l},a,n);break;case R.EventStatus.Finalize:i([{token:R.Token.Bot,status:R.OracleStatus.WaitResult}],{field:"endTime",direction:l},a,n);break;case R.EventStatus.Withdraw:s(r,{field:"blockNum",direction:l},a,n);break;default:throw new RangeError("Invalid tab position "+e)}}},{key:"render",value:function(){var e=this.props,t=e.theme,a=e.eventStatusIndex,n=R.EventStatus.Withdraw,r=a===n?this.topics:this.oracles,o=[];return o=0===r.length?h.default.createElement(A.default,null):a===n?r.map(function(e){return h.default.createElement(P.default,Object.assign({key:e.txid},e))}):r.map(function(e){return h.default.createElement(P.default,Object.assign({key:e.txid},e))}),h.default.createElement(L.default,{spacing:t.padding.sm.value,data:o,loadMore:this.loadMoreData,hasMore:o.length>=this.state.skip+z})}},{key:"oracles",get:function(){var e,t,a=this.props,n=a.oracles,o=a.eventStatusIndex,s=a.intl.formatMessage,i=(e={},r(e,R.EventStatus.Bet,s(q.placeBet)),r(e,R.EventStatus.Set,s(q.setResult)),r(e,R.EventStatus.Vote,s(q.arbitrate)),r(e,R.EventStatus.Finalize,s(q.finalizeResult)),r(e,R.EventStatus.Withdraw,s(q.withdraw)),e)[o],l=R.TransactionType.ApproveSetResult,u=R.TransactionType.SetResult,c=R.TransactionType.ApproveVote,d=R.TransactionType.Vote,p=R.TransactionType.FinalizeResult,f=R.TransactionType.Bet,m=(t={},r(t,R.EventStatus.Set,[l,u]),r(t,R.EventStatus.Vote,[c,d]),r(t,R.EventStatus.Finalize,[p]),r(t,R.EventStatus.Bet,[f]),t)[o]||[];return T.default.get(n,"data",[]).map(function(e){var t=parseFloat(T.default.sum(e.amounts).toFixed(2)),a=e.transactions.some(function(e){var t=e.type,a=e.status;return m.includes(t)&&a===N});return Object.assign({amountLabel:o!==R.EventStatus.Finalize?t+" "+e.token:"",url:"/oracle/"+e.topicAddress+"/"+e.address+"/"+e.txid,endTime:o===R.EventStatus.Set?e.resultSetEndTime:e.endTime,unconfirmed:!e.topicAddress&&!e.address||a,buttonText:i},e)})}},{key:"topics",get:function(){var e=this,t=R.TransactionType.WithdrawEscrow,a=R.TransactionType.Withdraw;return T.default.get(this.props.topics,"data",[]).map(function(n){var r=parseFloat(T.default.sum(n.qtumAmount).toFixed(2)),o=parseFloat(T.default.sum(n.botAmount).toFixed(2)),s=[t,a],i=n.transactions.some(function(e){var t=e.type,a=e.status;return s.includes(t)&&a===N});return Object.assign({amountLabel:r+" QTUM, "+o+" BOT",unconfirmed:i,url:"/topic/"+n.address,buttonText:e.props.intl.formatMessage(q.withdraw)},n)})}}]),t}(m.Component),d.propTypes={theme:y.default.object.isRequired,getActionableTopics:y.default.func.isRequired,topics:y.default.object,getOracles:y.default.func,oracles:y.default.object,eventStatusIndex:y.default.number.isRequired,sortBy:y.default.string,syncBlockNum:y.default.number,setAppLocation:y.default.func.isRequired,walletAddresses:y.default.array.isRequired,intl:E.intlShape.isRequired},d.defaultProps={topics:{},getOracles:void 0,oracles:{},sortBy:R.SortBy.Ascending,syncBlockNum:void 0},c=p))||c)||c)||c);t.default=F},2318:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){return{scroll:{width:"100%",display:"flex",flexWrap:"wrap",boxSizing:"border-box"},hint:{position:"fixed",bottom:"140px",left:"23px",boxShadow:"0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12)"}}};t.default=n},2319:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!==typeof t&&"function"!==typeof t?e:t}function s(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var i,l,u,c,d=function(){function e(e,t){for(var a=0;a<t.length;a++){var n=t[a];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,a,n){return a&&e(t.prototype,a),n&&e(t,n),t}}(),p=a(0),f=n(p),m=a(4),h=n(m),b=a(104),y=a(18),v=a(27),g=a(7),T=n(g),w=a(500),E=n(w),S=a(2320),x=n(S),R=a(67),k=(0,y.defineMessages)({raise:{id:"str.raised",defaultMessage:"Raised"},ends:{id:"str.ends",defaultMessage:"Ends"}}),M=(i=(0,v.withStyles)(x.default,{withTheme:!0}),(0,y.injectIntl)(l=i((c=u=function(e){function t(){return r(this,t),o(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return s(t,e),d(t,[{key:"render",value:function(){var e=this.props,t=e.classes,a=e.url,n=e.name,r=e.amountLabel,o=e.endTime,s=e.buttonText,i=e.unconfirmed,l=this.props.intl,u=l.locale,c=l.messages;return f.default.createElement(v.Grid,{item:!0,xs:12,sm:6,md:4,lg:3},f.default.createElement(b.Link,{to:a},f.default.createElement(v.Card,null,f.default.createElement("div",{className:(0,T.default)(t.eventCardSection,"top")},i&&f.default.createElement(E.default,{id:"str.pendingConfirmation",message:"Pending Confirmation"}),f.default.createElement(v.Typography,{variant:"headline",className:t.eventCardName},n),f.default.createElement("div",{className:t.dashboardTime},void 0!==o&&this.props.intl.formatMessage(k.ends)+": "+(0,R.getShortLocalDateTimeString)(o)),f.default.createElement("div",{className:t.eventCardInfo},r&&f.default.createElement("div",null,f.default.createElement("i",{className:(0,T.default)(t.dashBoardCardIcon,"icon iconfont icon-ic_token")}),f.default.createElement(y.FormattedMessage,{id:"str.raised",defaultMessage:"Raised"})," "+r),f.default.createElement("div",null,f.default.createElement("i",{className:(0,T.default)(t.dashBoardCardIcon,"icon iconfont icon-ic_timer")}),void 0!==o?""+(0,R.getEndTimeCountDownString)(o,u,c):f.default.createElement(y.FormattedMessage,{id:"str.end",defaultMessage:"Ended"})))),f.default.createElement(v.Divider,null),f.default.createElement("div",{className:(0,T.default)(t.eventCardSection,"button")},s))))}}]),t}(p.Component),u.propTypes={classes:h.default.object.isRequired,url:h.default.string.isRequired,name:h.default.string.isRequired,amountLabel:h.default.string,endTime:h.default.string,buttonText:h.default.string.isRequired,unconfirmed:h.default.bool.isRequired,intl:y.intlShape.isRequired},u.defaultProps={amountLabel:void 0,endTime:void 0},l=c))||l)||l);t.default=M},2320:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(e){return{eventCardSection:{position:"relative",padding:e.padding.sm.px,"&.top":{height:"320px"},"&.button":{textAlign:"center",paddingTop:e.padding.xs.px,paddingBottom:e.padding.xs.px,lineHeight:1,fontSize:e.sizes.font.textMd,color:e.palette.text.primary}},dashboardTime:{color:e.palette.text.hint},eventCardName:{marginBottom:e.padding.xs.px,display:"-webkit-box",maxWidth:"400px",maxHeight:"160px",margin:"0 auto",WebkitLineClamp:5,WebkitBoxOrient:"vertical",overflow:"hidden",textOverflow:"ellipsis"},unconfirmedTag:{background:e.palette.secondary.light,color:e.palette.secondary.main,border:"solid 1px "+e.palette.secondary.main,borderRadius:e.borderRadius,padding:"2px "+e.padding.unit.px,marginBottom:e.padding.unit.px,fontSize:e.sizes.font.meta},dashBoardCardIcon:{marginRight:e.padding.unit.px},eventCardInfo:{position:"absolute",bottom:e.padding.sm.px,color:e.palette.text.primary}}};t.default=n},2321:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var r=a(0),o=n(r),s=a(4),i=n(s),l=a(18),u=a(37),c=n(u),d=a(501),p=n(d),f=a(35),m=a(2322),h=n(m),b=function(e){var t=e.classes;return o.default.createElement("div",{className:t.eventsEmptyWrapper},o.default.createElement(p.default,{className:t.eventsEmptyIcon,fontSize:!0}),o.default.createElement(c.default,{variant:"body1"},o.default.createElement(l.FormattedMessage,{id:"dashboard.empty",defaultMessage:"No Event at Current Status"})," "))};b.propTypes={classes:i.default.object.isRequired},t.default=(0,f.withStyles)(h.default,{withTheme:!0})(b)},2322:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){return{eventsEmptyWrapper:{width:"300px",position:"relative",left:"50%",marginLeft:"-150px",top:"15vh",textAlign:"center"},eventsEmptyIcon:{fontSize:"100px",opacity:"0.15"}}};t.default=n},2323:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!==typeof t&&"function"!==typeof t?e:t}function s(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var i,l,u=function(){function e(e,t){for(var a=0;a<t.length;a++){var n=t[a];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,a,n){return a&&e(t.prototype,a),n&&e(t,n),t}}(),c=a(0),d=n(c),p=a(4),f=n(p),m=a(103),h=n(m),b=(l=i=function(e){function t(){var e,a,n,s;r(this,t);for(var i=arguments.length,l=Array(i),u=0;u<i;u++)l[u]=arguments[u];return a=n=o(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(l))),n.handleOnScroll=function(){var e=document.documentElement&&document.documentElement.scrollTop||document.body.scrollTop,t=document.documentElement&&document.documentElement.scrollHeight||document.body.scrollHeight,a=document.documentElement.clientHeight||window.innerHeight;Math.ceil(e+a)>=t&&n.props.hasMore&&n.props.loadMore()},s=a,o(n,s)}return s(t,e),u(t,[{key:"componentDidMount",value:function(){window.addEventListener("scroll",this.handleOnScroll)}},{key:"componentWillUnmount",value:function(){window.removeEventListener("scroll",this.handleOnScroll)}},{key:"render",value:function(){return d.default.createElement(h.default,{container:!0,spacing:this.props.spacing},this.props.data)}}]),t}(c.Component),i.propTypes={hasMore:f.default.bool,loadMore:f.default.func,spacing:f.default.number,data:f.default.oneOfType([f.default.array,f.default.object])},i.defaultProps={hasMore:!1,loadMore:void 0,spacing:void 0,data:void 0},l);t.default=b},2325:function(e,t,a){"use strict";function n(e,t,a){var n=(0,o.getIntlProvider)(t,a),r=n.formatMessage;switch(e){case s.TransactionType.ApproveCreateEvent:case s.TransactionType.ApproveSetResult:case s.TransactionType.ApproveVote:return r(i.approveBotTransfer);case s.TransactionType.CreateEvent:return r(i.createEvent);case s.TransactionType.Bet:return r(i.bet);case s.TransactionType.SetResult:return r(i.setResult);case s.TransactionType.Vote:return r(i.vote);case s.TransactionType.FinalizeResult:return r(i.finalizeResult);case s.TransactionType.Withdraw:return r(i.withdraw);case s.TransactionType.WithdrawEscrow:return r(i.withdrawEscrow);case s.TransactionType.Transfer:return r(i.transfer);case s.TransactionType.ResetApprove:return r(i.resetApproval);default:return console.error("Invalid txType: "+e),""}}Object.defineProperty(t,"__esModule",{value:!0}),t.getTxTypeString=n;var r=a(18),o=a(286),s=a(36),i=(0,r.defineMessages)({resetApproval:{id:"tx.resetApproval",defaultMessage:"Reset Approval"},approveBotTransfer:{id:"tx.approveBotTransfer",defaultMessage:"Approve BOT Transfer"},createEvent:{id:"str.createEvent",defaultMessage:"Create Event"},bet:{id:"str.bet",defaultMessage:"Bet"},setResult:{id:"str.setResult",defaultMessage:"Set Result"},vote:{id:"str.vote",defaultMessage:"Vote"},finalizeResult:{id:"str.finalizeResult",defaultMessage:"Finalize Result"},withdraw:{id:"str.withdraw",defaultMessage:"Withdraw"},withdrawEscrow:{id:"str.withdrawEscrow",defaultMessage:"Withdraw Escrow"},transfer:{id:"str.transfer",defaultMessage:"Transfer"}})},2360:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function r(e,t){var a={};for(var n in e)t.indexOf(n)>=0||Object.prototype.hasOwnProperty.call(e,n)&&(a[n]=e[n]);return a}function o(e){if(Array.isArray(e)){for(var t=0,a=Array(e.length);t<e.length;t++)a[t]=e[t];return a}return Array.from(e)}function s(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!==typeof t&&"function"!==typeof t?e:t}function l(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var u,c,d,p,f,m=function(){function e(e,t){for(var a=0;a<t.length;a++){var n=t[a];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,a,n){return a&&e(t.prototype,a),n&&e(t,n),t}}(),h=a(0),b=n(h),y=a(4),v=n(y),g=a(26),T=n(g),w=a(24),E=a(103),S=n(E),x=a(37),R=n(x),k=a(285),M=n(k),O=a(7),_=n(O),C=a(504),P=n(C),j=a(35),A=a(18),B=a(2361),L=n(B),q=a(68),N=n(q),z=a(2315),F=n(z),I=a(2316),W=n(I),D=a(45),H=n(D),V=a(84),G=n(V),Q=a(67),U=a(286),J=a(2325),X=a(36),Y=((0,A.defineMessages)({statusSuccess:{id:"str.success",defaultMessage:"Success"},statusPending:{id:"str.pending",defaultMessage:"Pending"},statusFail:{id:"str.fail",defaultMessage:"Fail"}}),u=(0,j.withStyles)(L.default,{withTheme:!0}),c=(0,w.connect)(function(e){return{syncBlockNum:e.App.get("syncBlockNum"),oracles:e.Graphql.get("getOraclesReturn"),transactions:e.Graphql.get("getTransactionsReturn")}},function(e){return{setAppLocation:function(t){return e(H.default.setAppLocation(t))},getOracles:function(t,a){return e(G.default.getOracles(t,a))},getTransactions:function(t,a,n,r){return e(G.default.getTransactions(t,a,n,r))}}}),(0,A.injectIntl)(d=u(d=c((f=p=function(e){function t(){var e,a,n,r;s(this,t);for(var l=arguments.length,u=Array(l),c=0;c<l;c++)u[c]=arguments[c];return a=n=i(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),n.state={transactions:[],order:X.SortBy.Descending.toLowerCase(),orderBy:"createdTime",perPage:10,page:0,limit:50,skip:0,expanded:[]},n.executeTxsRequest=function(){var e=n.state,t=e.orderBy,a=e.order,r=e.limit,o=e.skip,s=a===X.SortBy.Descending.toLowerCase()?X.SortBy.Descending:X.SortBy.Ascending;n.props.getTransactions([{type:X.TransactionType.ApproveCreateEvent},{type:X.TransactionType.CreateEvent},{type:X.TransactionType.Bet},{type:X.TransactionType.ApproveSetResult},{type:X.TransactionType.SetResult},{type:X.TransactionType.ApproveVote},{type:X.TransactionType.Vote},{type:X.TransactionType.FinalizeResult},{type:X.TransactionType.Withdraw},{type:X.TransactionType.WithdrawEscrow},{type:X.TransactionType.ResetApprove}],{field:t,direction:s},r,o)},n.getTableHeader=function(){var e=[{id:"createdTime",name:"str.time",nameDefault:"Time",numeric:!1,sortable:!0},{id:"type",name:"str.type",nameDefault:"Type",numeric:!1,sortable:!0},{id:"name",name:"str.name",nameDefault:"Name",numeric:!1,sortable:!1},{id:"amount",name:"str.amount",nameDefault:"Amount",numeric:!0,sortable:!0},{id:"fee",name:"str.fee",nameDefault:"Gas Fee (QTUM)",numeric:!0,sortable:!0},{id:"status",name:"str.status",nameDefault:"Status",numeric:!1,sortable:!0},{id:"actions",name:"str.empty",nameDefault:"",numeric:!1,sortable:!1}];return b.default.createElement(k.TableHead,null,b.default.createElement(k.TableRow,null,e.map(function(e){return e.sortable?n.getSortableCell(e):n.getNonSortableCell(e)})))},n.getSortableCell=function(e){var t=n.state,a=t.order,r=t.orderBy;return b.default.createElement(k.TableCell,{key:e.id,numeric:e.numeric,sortDirection:r===e.id&&a},b.default.createElement(P.default,{title:b.default.createElement(A.FormattedMessage,{id:"str.sort",defaultMessage:"Sort"}),enterDelay:N.default.intervals.tooltipDelay,placement:e.numeric?"bottom-end":"bottom-start"},b.default.createElement(k.TableSortLabel,{active:r===e.id,direction:a,onClick:n.createSortHandler(e.id)},b.default.createElement(A.FormattedMessage,{id:e.name,default:e.nameDefault}))))},n.getNonSortableCell=function(e){return b.default.createElement(k.TableCell,{key:e.id,numeric:e.numeric},b.default.createElement(A.FormattedMessage,{id:e.name,default:e.nameDefault}))},n.getTableRows=function(){var e=n.state,t=e.transactions,a=e.page,r=e.perPage,o=T.default.slice(t,a*r,a*r+r);return b.default.createElement(k.TableBody,null,T.default.map(o,function(e,t){return n.getTableRow(e,t)}))},n.handleClick=function(e,t){return function(a){var r=n.state.expanded,s=r.indexOf(e),i=[];t?n.props.getOracles([{topicAddress:t}],{field:"endTime",direction:X.SortBy.Descending}):i=-1===s?[].concat(o(r),[e]):[].concat(o(r.slice(0,s)),o(r.slice(s+1))),n.setState({expanded:i})}},n.getTableRow=function(e){var t=e.name,a=e.topic,r=e.type,o=e.txid,s=e.amount,i=e.token,l=e.fee,u=e.status,c=e.createdTime,d=n.props,p=d.intl,f=d.classes,m=p.locale,h=p.messages,y=[],v=n.state.expanded.includes(o);return y[0]=b.default.createElement(k.TableRow,{key:o,selected:v,onClick:n.handleClick(o),className:f.clickToExpandRow},b.default.createElement(k.TableCell,{className:f.summaryRowCell},(0,Q.getShortLocalDateTimeString)(c)),b.default.createElement(k.TableCell,null,(0,J.getTxTypeString)(r,m,h)),b.default.createElement(K,{clickable:a&&a.address,onClick:n.handleClick(o,a&&a.address)},t||a&&a.name),b.default.createElement(k.TableCell,{numeric:!0},(s||"")+"  "+(s?i:"")),b.default.createElement(k.TableCell,{numeric:!0},l),b.default.createElement(k.TableCell,null,b.default.createElement(A.FormattedMessage,{id:("str."+u).toLowerCase()},function(e){return(0,U.i18nToUpperCase)(e)})),b.default.createElement(k.TableCell,null,b.default.createElement("i",{className:(0,_.default)(v?"icon-ic_down":"icon-ic_up","icon iconfont",f.arrowSize)}))),y[1]=b.default.createElement(k.TableRow,{key:"txaddr-"+o,selected:!0,onClick:n.handleClick(o),className:v?f.show:f.hide},b.default.createElement(W.default,{transaction:e,className:f.detailRow}),b.default.createElement(k.TableCell,null),b.default.createElement(F.default,{transaction:e}),b.default.createElement(k.TableCell,null),b.default.createElement(k.TableCell,null),b.default.createElement(k.TableCell,null),b.default.createElement(k.TableCell,null)),y},n.getTableFooter=function(){var e=n.state,t=e.transactions,a=e.perPage,r=e.page;return b.default.createElement(k.TableFooter,null,b.default.createElement(k.TableRow,null,b.default.createElement(k.TablePagination,{colSpan:12,count:t.length,rowsPerPage:a,page:r,onChangePage:n.handleChangePage,onChangeRowsPerPage:n.handleChangePerPage})))},n.handleChangePage=function(e,t){var a=n.state,r=a.transactions,o=a.perPage,s=a.skip;n.setState({expanded:[]});var i=s;Math.floor(r.length/o)-1===t&&(i=r.length),n.setState({page:t,skip:i})},n.handleChangePerPage=function(e){n.setState({perPage:e.target.value})},n.createSortHandler=function(e){return function(t){n.handleSorting(t,e)}},n.handleSorting=function(e,t){var a=n.state.transactions,r=t,o=X.SortBy.Descending.toLowerCase();n.state.orderBy===t&&n.state.order===X.SortBy.Descending.toLowerCase()&&(o=X.SortBy.Ascending.toLowerCase());var s=T.default.orderBy(a,[r],[o]);n.setState({transactions:s,orderBy:r,order:o})},r=a,i(n,r)}return l(t,e),m(t,[{key:"componentWillMount",value:function(){(0,this.props.setAppLocation)(X.AppLocation.activityHistory),this.executeTxsRequest()}},{key:"componentWillReceiveProps",value:function(e){var t=this.props,a=t.oracles,n=t.transactions,r=t.syncBlockNum;if(e.oracles!==a){var o=(0,Q.getDetailPagePath)(e.oracles.data);o&&this.props.history.push(o)}if(e.syncBlockNum!==r&&this.executeTxsRequest(),e.transactions||n){var s=T.default.orderBy(e.transactions?e.transactions:n,[this.state.orderBy],[this.state.order]);this.setState({transactions:s})}}},{key:"componentDidUpdate",value:function(e,t){this.state.skip!==t.skip&&this.executeTxsRequest()}},{key:"render",value:function(){var e=this.props.classes,t=this.state.transactions;return b.default.createElement(S.default,{container:!0,spacing:0},t.length?b.default.createElement(M.default,{className:e.historyTable},this.getTableHeader(),this.getTableRows(),this.getTableFooter()):b.default.createElement(R.default,{variant:"body1"},b.default.createElement(A.FormattedMessage,{id:"str.emptyTxHistory",defaultMessage:"You do not have any transactions right now."})))}}]),t}(h.Component),p.propTypes={intl:A.intlShape.isRequired,history:v.default.object.isRequired,classes:v.default.object.isRequired,setAppLocation:v.default.func.isRequired,getOracles:v.default.func.isRequired,oracles:v.default.object,getTransactions:v.default.func.isRequired,transactions:v.default.array,syncBlockNum:v.default.number.isRequired},p.defaultProps={oracles:void 0,transactions:void 0},d=f))||d)||d)||d);t.default=Y;var K=(0,j.withStyles)(L.default)(function(e){var t=e.classes,a=e.clickable,n=(e.topic,r(e,["classes","clickable","topic"]));return b.default.createElement(k.TableCell,null,b.default.createElement("span",Object.assign({className:a&&t.viewEventLink},n)))})},2361:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){return{historyTable:{overflowX:"scroll"},viewEventLink:{"&:hover":{color:"#585AFA",cursor:"pointer"},textDecoration:"underline"},clickToExpandRow:{cursor:"pointer"},summaryRowCell:{paddingTop:"24px",paddingBottom:"24px"},hide:{display:"none"},show:{display:"table-row"},arrowSize:{fontSize:"8px"}}};t.default=n},2362:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(e){return{activitiesTabWrapper:{background:e.palette.background.paper,position:"fixed",top:e.sizes.navHeight,left:0,right:0},activitiesTabContainer:{marginTop:e.sizes.navHeight}}};t.default=n}});