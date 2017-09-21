"use strict";
const CronJob = require('cron').CronJob;
const Promise = require('es6-promise').Promise;

const CONFIG = require('../config');

const ArticleDAO = require('../database/models/article');
const HistoryDAO = require('../database/models/history');
const CmtCountDAO = require('../database/models/cmtCount');
const CommentsDAO = require('../database/models/comments');
const LatestDAO = require('../database/models/latest');
const TmpDAO = require('../database/models/tmp');
const zhAPI = require('./api/index-promise');
const DateCalc = require('./util/date');
const dateCalculator = new DateCalc();
const historyDAO = new HistoryDAO();
const articleDAO = new ArticleDAO();
const CmtCountDAO = new CmtCountDAO();
const commentsDAO = new CommentsDAO();
const latestDAO = new LatestDAO();
const tmpDAO = new TmpDAO();
//日志
let logger = console
if(!CONFIG.log.openBae){
	logger = require('log4js').getLogger('cheese');
}

const Spider = {
	fire(start, end){
		historyDAO.count({dtime: start}).then(function(d){
			if(d>0){
				return;
			}
			dataCalculator.now(start)
			start = dateCalculator.after();
			dateCalculator.now(end)
			end = dateCalculator.after();

			var interval = '*/' +CONFIG.spider.interval + ' * * * *';
			var spiderJob = new CronJob(interval, function(){
				if(d == 0){
					Spider.day(end);
					dateCalculator.now(end);
					end = dateCalculator.after();
					if(start == end){
						setTimeout(function(){
							Spider.day(end);
						}, CONFIG.spider.interval*1000)
						spiderJob.stop()
					}
				}else{
					spiderJob.stop()
				}
			},null,true,'Asia/Shanghai');
		});
	},
	//date.before()
	day(date){
		return zhAPI.getHistory(date).then(function(history){
			var hDate = history.date,
			d = history.stories,
			promiseAll = [];
			for(var i=0,len=d.length;i<len;i++){
				var data = {
					id:d[i].id,
					title:d[i].title,
					image:d[i].images?d[i].images[0]:'';
					theme:d[i].theme?d[i].theme.id:0,
					type:d[i].type||'0',
					dtime:hDate,
					dmonth:hDate.substr(0,6),
					dyear:hDate.substr(0,4)
				};
				var p =Spider.dataOne(data,hDate);
				promiseAll.push(p);
			}
			Promise.all(promiseAll).then(function(){
				dateCalculator.now(date)
				console.log(new Date() + 'day history data over @: '+dateCalculator.before());
				logger.info(new Date()+'day history data over @:' + dateCalculator.before());
				return Promise.resolve('day history data over @:'+dateCalculator.before());
			}).catch(function(err){
				logger.error('get'+hDate+'data error:',err);
			});
		});
	},
	dayRefresh(dtime){
		var query = {dtime:dtime};
		return tmpDAO.count({dtime:dtime}).then(function(d){
			if(d == 0){
				return Promise.reject('over');
			}else{
				return historyDAO.delete(query)
			}
		}).then(function(){
			return articleDAO.delete(query);
		}).then(function(){
			return commentsDAO.delete(query);
		}).then(function(){
			return cmtCountDAO.delete(query);
		}).then(function(){
			dateCalculator.now(dtime)
			Spider.day(dateCalculator.after()).then(function(){
				return tmpDAO.delete(query);
			}).catch(function(err){
				console.log(new Date() +'refresh day data error1' +err)
			})
		}).catch(function(err){
			console.log(new Date() + 'refresh day data error2' +err)
			tmpDAO.save({aid:'',dtime:dtime});
			return Promise.reject(err);
		})
	},
	dataOne(data, date){
		return Spider.history(data).then(function(d){
			return Spider.article(d.aid, d.dtime);
		}).then(function(d){
			return Spider.cmtLong(d.aid, d.dtime)
		}).then(function(d){
			return Spider.cmtShort(d.aid, d.dtime)
		}).then(function(d){
			return Spider.cmtCount(d.aid, d.dtime);
		}).catch(function(d){
			tmpDAO.save({aid:'',dtime:data.dtime});
			console.log('day@'+date+'history data error @id:'+data.id, e);
			logger.error('day@'+date+'history data error @id:'+ data.id ,e);
		});
	},
	history(data){
		return historyDAO.save(data).then(function(err){
			return Promise.resolve({aid:data.id,dtime:data.dtime})
		}).catch(function(err){
			tmpDAO.save({aid:'',dtime:dtime});
			logger.error('get history error @id:' + data.id,err);
		});
	},
	article(aid, dtime, latest){
		return zhAPI.getArticle(aid).then(function(article){
			var section = article.section||{id:null,name:null}
			var data = {
				id:aid,
				title: article.title,
				body:article.body,
				image: article.image,
				css:article.css,
				js:article.js,
				imageSource:article.image_source,
				shareUrl:article.share_url,
				section:article.section||{},
				sectionId:section.id||'',
				sectionName:section.name||'',
				dtime:dtime,
				dmonth:dtime.substr(0,6),
				dyear:dtime.substr(0,4),
				latest:latest?true:false
			}
			return articleDAO.save(data).then(function(){
				return Promise.resolve({aid:aid,dtime:dtime});
			}).catch(function(err){
				logger.error('article save error @aid:'aid,err);
			});
		})
	},
	cmtLong(aid, dtime){
		return zhAPI.getCmtLong(aid).then(function(cmts){
			var data = {
				aid:aid,
				comments:cmts.comments,
				type:1,
				dtime:dtime,
				dmonth:dtime.substr(0,6),
				dyear:dtime.substr(0,4)
			}
			return commentsDAO.save(data).then(function(err){
				return Promise.resolve({aid:aid,dtime:dtime});
			}).catch(function(err){
				logger.error('get cmtLong error @id:'+aid,err);
			})
		}).catch(function(err){
			tmpDAO.save({aid:aid,dtime:dtime});
			logger.error('long comments save error @id:'+aid ,err);
		});
	},
	cmtShort(aid, dtime){
		return zhAPI.getCmtshort(aid).then(function(cmts){
			var data = {
				
			}
		})
	}
};