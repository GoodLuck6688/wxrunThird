//index.js
//获取应用实例
const app = getApp()
const config = require('../../config.js')

Page({
    data: {
        wxrun: "0",
        openid: null,
        mymodal: false,
        ads: null,
        big_img: '',
        yibiaopan: false,
        isIos:false,
        show:false,
        objectMultiArray: null,
        index:0,
        //multiIndex: [0, 0],
        realname:'',
    },
    bindMultiPickerColumnChange: function (e) {
        // console.log(e)
        let that = this;
        that.setData({
            index: e.detail.value
        })
        
        // var data = {
        //     objectMultiArray: this.data.objectMultiArray,
        //     multiIndex: this.data.multiIndex
        // };
        // data.multiIndex[e.detail.column] = e.detail.value;
        // if (e.detail.column == 0){
        //     wx.request({
        //         url: config.service.requestUrl,
        //         data: {
        //             a: 'selectTeam',
        //             pid: data.objectMultiArray[0][e.detail.value]['id'],
        //         },
        //         success: function (res) {
        //             data.objectMultiArray[1] = res.data.data
        //             data.multiIndex[1] = 0
        //             that.setData(data);
        //         }
        //     })
        // }
        // that.setData(data);
    },
    //验证团队名称
    checkrealname: function (e) {
        let that = this;
        if (e.detail.value == '') {
            wx.showToast({
                title: '姓名不能为空',
                icon: 'none',
                duration: 2000
            })
        }
        that.setData({
            realname: e.detail.value
        })
    },
    //提交
    formSubmit: function (e) {
        let that = this;
        if (that.data.realname == '') {
            wx.showToast({
                title: '姓名不能为空',
                icon: 'none',
                duration: 2000
            })
            return false;
        }
        wx.request({
            url: config.service.requestUrl,
            data: {
                a: 'joinTeam',
                tm_id: that.data.objectMultiArray[that.data.index]['id'],
                realname:that.data.realname,
                openid:wx.getStorageSync('openid')
            },
            success: function (res) {
                // console.log(res)
                wx.showToast({
                    title: res.data.msg,
                    icon: 'none',
                    duration: 2000
                })
                if(res.data.code == 'ok'){
                    that.closeForm();
                }
            }
        })
    },
    //关闭modal
    closeForm: function () {
        this.setData({
            show: false,
        })
    },
    onLoad: function (option) {
        var that = this;
        if (app.globalData.userInfo) {
            that.insertUser(app.globalData.userInfo);
        } else if (this.data.canIUse) {
            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
            // 所以此处加入 callback 以防止这种情况
            app.userInfoReadyCallback = res => {
                that.insertUser(app.globalData.userInfo);
            }
        } else {
            // 在没有 open-type=getUserInfo 版本的兼容处理
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo
                    that.insertUser(app.globalData.userInfo);
                }
            })
        }
        
        wx.setNavigationBarTitle({ title: '微信运动' })
        wx.getSystemInfo({
            success: function (res) {
                wx.setStorageSync('platform', res.platform);
                wx.setStorageSync('screenWidth', res.screenWidth);
            }
        })
        
        //获取广告
        that.getAds();
        
        if (option.uid != undefined && option.logtype != undefined && option.rid != undefined && option.keyword != undefined) {
            //索取或赠送
            that.linkGiftLog(option);//关联索取和赠送
        }
       
    },
    onReady: function (e) {
        //获取微信运动步数
        this.getWxRunStep();
    },
    //关联索取和赠送
    linkGiftLog(option) {
        var that = this;
        wx.request({
            url: config.service.requestUrl,
            data: { 
                a: 'linkGiftLog', 
                uid: wx.getStorageSync('uid'), 
                fromid: option.uid, 
                logtype: option.logtype, 
                rid: option.rid, 
                keyword: option.keyword 
            },
            success: function (res) {
                if (res.data.code == 'ok' && res.data.logtype == '1') {
                    wx.showToast({
                        title: option.keyword + '字存入账号',
                        icon: 'success',
                        image: '',
                        duration: 2000
                    })
                }
            }
        })
    },
    
    //获取微信运动步数
    getWxRunStep: function () {
        //微信步数 
        var that = this;
        wx.getWeRunData({
            success(res) {
                // console.log(res)
                wx.request({
                    url: config.service.requestUrl,
                    data: {
                        a:'wxDecode',
                        encryptedData: res.encryptedData,
                        iv: res.iv,
                        sessionKey: wx.getStorageSync('sessionKey'),
                        openid: wx.getStorageSync('openid')
                    },
                    success: function (o) {
                        // console.log(o)
                        var oo = app.strToJson(o);
                        if (wx.getStorageSync('platform') == 'devtools' || wx.getStorageSync('platform') == 'ios') {
                            
                            that.setData({
                                isIos: true,
                                yibiaopan: true,
                            })
                        } 

                        //获取当天的步数
                        wx.setStorageSync('wx_step', oo.stepInfoList[30].step);
                        // console.log(oo)
                        that.setData({
                            wxrun: oo.stepInfoList[30].step
                        });
                        that.canvasArc();
                        that.syncStep(oo.stepInfoList);
                        that.getFuZi(oo.stepInfoList[30].step);
                    }
                })
            },
            fail(ret){
                console.log(ret)
            }
        })
    },
    //获取福字
    getFuZi: function (step) {
        var that = this;
        
        wx.request({
            url: config.service.requestUrl,
            data: { 
                a: 'getRandChar', 
                rid: wx.getStorageSync('zi_rid'), 
                openid: wx.getStorageSync('openid'),
                step: step 
            },
            success: function (res) {
                // console.log(res)
                if (res.data.code == 'ok') {
                    var imgs = res.data.data;
                    if (imgs.length != 0) {
                        that.setData({
                            mymodal: true,
                            big_img: imgs[0]['img'],
                            yibiaopan: true,
                        })
                        imgs.shift();
                        wx.setStorageSync('fuzi', imgs)
                    }
                }
            }
        })
    },
    //获取广告
    getAds: function () {
        var that = this;
        wx.request({
            url: config.service.requestUrl,
            data: { a: 'getAds' },
            success: function (res) {
                // console.log(res)
                var oo = app.strToJson(res);
                wx.setStorageSync('zi_rid', oo[0].rid);
                that.setData({
                    ads: oo,
                })
            }
        })
    },
    //刻画仪表盘
    canvasArc: function () {
        // 使用 wx.createContext 获取绘图上下文 context
        var context = wx.createCanvasContext('firstCanvas');
        var step = wx.getStorageSync('wx_step') + " 步";
        var end = (wx.getStorageSync('wx_step') / 20000 * 1.4 * Math.PI) + 0.8 * Math.PI;


        context.beginPath()//开始画白色的底
        context.arc(150, 120, 100, 0.8 * Math.PI, 2.2 * Math.PI, false)
        context.setStrokeStyle("#ffffff")
        context.setLineWidth(10)
        context.stroke()

        context.beginPath()//开始画进度
        context.arc(150, 120, 100, 0.8 * Math.PI, end, false)
        context.setStrokeStyle("#12B0DF")
        context.setLineWidth(10)
        context.stroke()

        context.draw()
    },

    //捐步
    giveStep: function () {
        var that = this;

        this.setData({
            mymodal: true,
        })
    },
    //获取步数
    getStep: function () {

        this.setData({
            wxrun: wx.getStorageSync('wx_step')
        })
    },
    //跳转
    redirectTo: function (e) {
        // console.log(e);
        wx.navigateTo({
            url: e.target.dataset.link,
        })
    },
    //转发
    onShareAppMessage: function (res) {
        if (res.from === 'button') {
            // 来自页面内转发按钮,关闭分享
            this.cancel();
        }
        return {
            title: '微信运动,集字领福利',
            path: '/pages/index/index',
            imageUrl: config.service.imageUrl+"indexshare.jpg",
            success: function (res) {
                // 转发成功
                //console.log('转发成功');
                wx.showToast({
                    title: '转发成功',
                    icon: 'success',
                    duration: 2000
                })
            },
            fail: function (res) {
                // 转发失败
                console.log('转发失败');
            }
        }
    },
    //关闭modal框
    cancel: function () {
        var imgs = wx.getStorageSync('fuzi');
        //console.log(imgs);
        if (imgs.length == 0) {
            this.setData({
                mymodal: false,
                yibiaopan: false,
            })

        } else {
            this.setData({
                big_img: imgs[0]['img'],
            })
            imgs.shift();
            wx.setStorageSync('fuzi', imgs);
        }

    },
    //关闭ios提示
    close:function(){
        this.setData({
            isIos:false,
            yibiaopan: false,
        })
    },
    //置顶小程序
    setTopBarText: function () {
        wx.setTopBarText({
            text: '微信运动',
            success: function () {
                //console.log('置顶成功')
                wx.showToast({
                    title: '置顶成功',
                    icon: 'success',
                    duration: 2000
                })
            },
            fail: function () {
                console.log('置顶失败')
            }
        })
    },
    
    //同步步数
    syncStep(step){
        //console.log(step)
        wx.request({
            url: config.service.requestUrl,
            data: { a: 'syncStep', openid: wx.getStorageSync('openid'), step: JSON.stringify(step) },
            success: function (res) {
                // console.log(res)
            }
        })
    },
    //跳转到排行榜页面
    personRank: function () {
        wx.navigateTo({
            url: '../rank/rank?cid=1',
        })
    },
   
    //跳转到排行榜页面
    teamRank: function () {
        let that = this;
        wx.request({
            url: config.service.requestUrl,
            data: { a: 'isrank',openid: wx.getStorageSync('openid')},
            success: function (res) {
                let o = app.strToJson(res)
                if (o.code == 'ok') {
                    wx.navigateTo({
                        url: '../rank/rank?cid=2&istm=' + o.data,
                    })
                } else if (o.code == 'no1'){
                    
                    that.setData({
                        show:true,
                        objectMultiArray: o.data,
                    })
                } else {
                    wx.showToast({
                        title: o.msg,
                        icon: 'none',
                        duration: 2000
                    })
                }
            }
        })
    },
    //用户信息入库
    insertUser: function (user) {
        var that = this;
        wx.request({
            url: config.service.requestUrl,
            data: { 
                a: 'insertUser', 
                openid: wx.getStorageSync('openid'), 
                avatar: user.avatarUrl,
                nickname: user.nickName
            },
            success: function (res) {
                let oo = app.strToJson(res);
                // console.log(oo, user);
                if (res.data.code == 'no') {
                    //that.insertUser(user);
                } else {
                    wx.setStorageSync('uid', oo.uid)
                }
            }
        })
    }, 
    
})
