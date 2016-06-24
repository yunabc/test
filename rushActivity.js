/***********************
rush info init method

rushItems: [    //object list of rush item{
'activityId':123, //activity id
'activityNotBeginContent':item,  //jquery object of not begin status display content
'activityInProgressingContent':item,   //jquery object of in progressing status display content
// add by zhusimei
'activityInProgressingFunction':function(){},  //function of in progressing status
'activityEndedContent':item,  //jquery object of ended status display content
// add by zhusimei
'activityEndedFunction':function(){},  //function of ended status
'productHasSoldOutContent':item,  //jquery object of sold out status display content
// add by zhusimei
'productHasSoldOutFunction':function(){},  //function of sold out status
'countDownContent':item,	//jquery object of count display content
'displayCountDownFunction':function(d,h,m,s){},  //function of display the countdown of activity start
'displayEndCountDownFunction':function(d,h,m,s){},  //function of display the countdown of activity end
// add by zhusimei
'isShowReservationCountDown':true, //is show reservation countdown
'surplusShowReservationEndTime':7200000, //distance reservation end time to show countdown
'displayReservationCountDownFunction':function(d,h,m,s){},//function of display the countdown of reservation end
'displayActivityFunction':function(){},  //function of display the activity
'hideActivityFunction':function(){}   //function of hide the activity
},
...
]
 ************************/
//global countdown events array
//var timeArray = [];
var rushActivity = function (rushItems, callback) {
	//stop all countdown in page
	//$.each(timeArray, function(n,e){
	//  if(e){
	//    e.stop();
	//  }
	//});
	//reset the global events array
	var timeArray = [];

	if (rushItems.length < 1) {
		//can't read any activity from parameters
		console.log('cannot find any activity, please check the parameters of rushActivity!');
		return;
	}
	var activityIds = [];
	//get all activity id from parameter
	for (var i = 0; i < rushItems.length; i++) {
		if (rushItems[i].activityId) {
			activityIds.push(rushItems[i].activityId);
		}
	}
	if (activityIds.length < 1) {
		//can't read any activity from parameters
		console.log('cannot find any activity, please check the parameters of rushActivity!');
		return;
	}
	var params = {
		'activityIds' : activityIds
	};
	//get all activity info in page from server
	Js.sendData("http://in.webapiv2.go.lemall.com/api/promotion/rushList.jsonp", "params=" + JSON.stringify(params), function (data) {
		if (data.status == "1") {
			//rush info list
			var rushList = data.response.rushList;
			if (rushList.length < 1) {
				return;
			}
			//set display or hide status and set countdown event of activities
			for (var i = 0; i < rushList.length; i++) {
				(function(){
					var rushItemTemps = rushItems; // 初始参数
					var rushInfo = rushList[i];// 请求回的list的第i项
					var rushItem;
					for (var j = 0; j < rushItemTemps.length; j++) {
						if (rushItemTemps[j].activityId == rushInfo.activityId) {
							// 找到activityId匹配的初始参数对象
							rushItem = rushItemTemps[j];
						}
					}
					if (rushInfo.surplusShowStartTime > 0) {
						//set display activity event countdown  剩余开始时间
						var time_xy1 = Js.Tools.showCountDown(rushInfo.surplusShowStartTime * 1000, new Date().getTime() + rushItem.activityId,
								function (d, h, m, s) {}, function () {
								if (rushItem.displayActivityFunction) {
									rushItem.displayActivityFunction();
								}
							});
						timeArray.push(time_xy1);
					}
					//set display reservation end time event countdown
					if (rushItem.isShowReservationCountDown) {// 是否显示预约倒计时
						var surplusShowReservationStartTime = rushInfo.surplusStartTime * 1000 - rushItem.surplusShowReservationEndTime; //剩余预约倒计时时间=预约开始时间-预约结束时间
						if (surplusShowReservationStartTime > 0) {
							var time_xy = Js.Tools.showCountDown(surplusShowReservationStartTime, new Date().getTime() + rushItem.activityId,
									function (d, h, m, s) {
									if (rushItem.displayReservationCountDownFunction) {
										rushItem.displayReservationCountDownFunction(d, h, m, s);
									}
								}, function () {
									if (rushItem.displayActivityFunction) {
										rushItem.displayActivityFunction();
									}
								});
							timeArray.push(time_xy);
						}
					}
					if (rushInfo.surplusShowEndTime > 0) {
						//set hide activity event countdown
						var time_xy2 = Js.Tools.showCountDown(rushInfo.surplusShowEndTime * 1000, new Date().getTime() + rushItem.activityId,
								function (d, h, m, s) {}, function () {
								if (rushItem.hideActivityFunction) {
									rushItem.hideActivityFunction();
								}
							});
						timeArray.push(time_xy2);
					}

					if (rushInfo.status == 1) {
						//activity not begin
						if (rushInfo.surplusShowStartTime <= 0) {
							rushItem.displayActivityFunction();
						}

						// 展示预约倒计时和not start判断
						rushItem.activityEndedContent.hide();
						rushItem.activityNotBeginContent.removeClass('hidden').show();
						if (rushItem.isShowReservationCountDown) {
							var surplusShowReservationStartTime = rushInfo.surplusStartTime * 1000 - rushItem.surplusShowReservationEndTime;
							if (surplusShowReservationStartTime > 0) {
								rushItem.activityNotBeginContent.hide();
								rushItem.activityEndedContent.removeClass('hidden').show();
							}
						}

						rushItem.activityInProgressingContent.hide();
						rushItem.productHasSoldOutContent.hide();
						var time_xy = Js.Tools.showCountDown(rushInfo.surplusStartTime * 1000, new Date().getTime() + rushItem.activityId,
								function (d, h, m, s) {
								if (rushItem.displayCountDownFunction) {
									rushItem.displayCountDownFunction(d, h, m, s);
								}
							}, function () {
								rushItem.activityNotBeginContent.hide();
								rushItem.activityInProgressingContent.removeClass('hidden').show();
								//check activities status again
								setTimeout(function () {
									rushActivity(rushItemTemps);
								}, 0);
							});
						timeArray.push(time_xy);
					} else if (rushInfo.status == 2) {
						//activity in progressing
						rushItem.displayActivityFunction();
						rushItem.activityNotBeginContent.hide();
						rushItem.activityInProgressingContent.removeClass('hidden').show();
						rushItem.activityEndedContent.hide();
						rushItem.productHasSoldOutContent.hide();
						//if(rushItem.countDownContent){
						//  	rushItem.countDownContent.hide();
						//}
						var time_xy = Js.Tools.showCountDown(rushInfo.surplusEndTime * 1000, new Date().getTime() + rushItem.activityId,
								function (d, h, m, s) {
								if (rushItem.displayEndCountDownFunction) {
									rushItem.displayEndCountDownFunction(d, h, m, s);
								}
							}, function () {
								rushItem.activityNotBeginContent.hide();
								rushItem.activityInProgressingContent.hide();
								rushItem.activityEndedContent.removeClass('hidden').show();
							});
						timeArray.push(time_xy);
            if(rushItem.activityInProgressingFunction){
                rushItem.activityInProgressingFunction();
            }
					} else if (rushInfo.status == 3) {
						//product has sold out
						if (rushInfo.surplusShowEndTime > 0) {
							rushItem.displayActivityFunction();
						} else {
							rushItem.hideActivityFunction();
						}

						var time_xy3 = Js.Tools.showCountDown(rushInfo.surplusEndTime * 1000, new Date().getTime() + rushItem.activityId,
								function (d, h, m, s) {
								if (rushItem.displayEndCountDownFunction) {
									rushItem.displayEndCountDownFunction(d, h, m, s);
								}
							}, function () {
								rushItem.activityNotBeginContent.hide();
								rushItem.activityInProgressingContent.hide();
								rushItem.activityEndedContent.removeClass('hidden').show();
							});
						timeArray.push(time_xy3);

						rushItem.activityNotBeginContent.hide();
						rushItem.activityInProgressingContent.hide();
						rushItem.activityEndedContent.hide();
						if (rushItem.productHasSoldOutFunction) {
							rushItem.productHasSoldOutFunction();
						}
						rushItem.productHasSoldOutContent.removeClass('hidden').show();
					} else {
						//activity has end
						if (rushInfo.surplusShowEndTime > 0) {
							rushItem.displayActivityFunction();
						} else {
							rushItem.hideActivityFunction();
						}
                        if(rushItem.activityEndedFunction){
                            rushItem.activityEndedFunction();
                        }
						rushItem.activityNotBeginContent.hide();
						rushItem.activityInProgressingContent.hide();
						rushItem.productHasSoldOutContent.hide();
						rushItem.activityEndedContent.removeClass('hidden').show();
					}

					if (callback) {
						callback(rushInfo.status);
					}
				})();
			}
		}
	});
};