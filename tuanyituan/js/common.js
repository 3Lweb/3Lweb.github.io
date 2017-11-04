document.addEventListener('DOMContentLoaded',function(){
		var rem = document.documentElement.clientWidth*20/320;
		// window.onresize=function(){
		// 	rem = document.documentElement.clientWidth*20/320;
		// 	document.documentElement.style.fontSize=rem+'px';
		// };
		document.documentElement.style.fontSize=rem+'px';
		var oShowImg = document.querySelector('.show .showImg');
		var oShowBtn = document.querySelector('.show .showbtn');
		var aImg = oShowImg.children;
		var aBtn = oShowBtn.children;
		
		// 轮播图
		oShowImg.style.width=(aImg.length*aImg[0].offsetWidth)/rem+'rem';
		var iNow = 1;
		var x = -aImg[0].offsetWidth/rem;
		var bOk=false;
oShowImg.addEventListener('touchstart',function(ev){
		if(bOk)return;
		bOk = true;
		var downX = ev.targetTouches[0].pageX/rem;
		var disX = downX-x;
		function fnMove(ev){
			x = ev.targetTouches[0].pageX/rem-disX;
			oShowImg.style.WebkitTransform = 'translate3d('+x+'rem,0,0)';
		}
		function fnEnd(ev){
			document.removeEventListener('touchmove',fnMove,false);
			document.removeEventListener('touchend',fnEnd,false);
			var upX = ev.changedTouches[0].pageX/rem;
			
			if(Math.abs(upX-downX)>100/rem){
				if(upX<downX){
					iNow++;
				}else {
					iNow--;
				}
			}
			
			
			oShowImg.style.WebkitTransition = '.4s all ease';
			
			x = -iNow*aImg[0].offsetWidth/rem;
			oShowImg.style.WebkitTransform = 'translate3d('+x+'rem,0,0)';
			function tranEnd(){
				oShowImg.removeEventListener('transitionend',tranEnd,false);
				oShowImg.style.WebkitTransition = 'none';
				
				if(iNow==0){
					iNow = aImg.length-2;
				}
				if(iNow==aImg.length-1){
					iNow = 1;
				}
				x = -iNow*aImg[0].offsetWidth/rem;
				for(var i=0;i<aBtn.length;i++){
					aBtn[i].className='';
				}
				aBtn[iNow-1].className='active';
				oShowImg.style.WebkitTransform = 'translate3d('+x+'rem,0,0)';
				
				bOk = false;
			}
			oShowImg.addEventListener('transitionend',tranEnd,false);
		}
		document.addEventListener('touchmove',fnMove,false);
		document.addEventListener('touchend',fnEnd,false);
		ev.preventDefault();
	},false);
	},false);