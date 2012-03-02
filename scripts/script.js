var cmerlink = "http://cmer.uoguelph.ca/";
var resultquery = "";
var ret_results = 100;
var openpageurl = "";

var numOfPapers = 0;
var pages = 0;
var citePages = new Array();
var done = false;
var publications = 0;
var minyear = 9000;
var maxyear = -1000;
var currentPage = 0;
var counter = 0;

function openCMERWebsite() {
	var args = new blackberry.invoke.BrowserArguments(cmerlink);
	blackberry.invoke.invoke(blackberry.invoke.APP_BROWSER, args);
}

function openPage() 
{ 
	var args = new blackberry.invoke.BrowserArguments(openpageurl); 
	blackberry.invoke.invoke(blackberry.invoke.APP_BROWSER, args); 
} 

function getScholarResults(authorname) {
	if (authorname == "" || authorname == null) {
		alert ("Author Name is Empty!");
		return;
	}
	document.getElementById("loading").style.display="";
	document.getElementById("searchinfo").style.display="none";
	document.getElementById("results").innerHTML="";
	
	var authorarray = authorname.split(" ");	
	for (var i=0; i<authorarray.length; i++)
	{
		authorarray[i] = "author%3A".concat(authorarray[i]);
	}
	
	resultquery = "";
	for (var i=0; i<authorarray.length; i++)
	{
		if (i==0)
		{
			resultquery = resultquery + authorarray[i];
		}
		else
		{
			resultquery = resultquery + "+" + authorarray[i];
		}
	}
	//Create request URL
	var url = "http://scholar.google.ca/scholar?q="+resultquery+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on";	
	openpageurl = url;
	
	$.get(url, function(responseText)
	{
		//The code for hanlding the response goes in here
		if (responseText == null)
		{
			alert("There is no data.");
			document.getElementById("loading").style.display="none";
			return;
		}
		
		if (responseText.indexOf('did not match any articles')!=-1)
		{
			//no results
			document.getElementById("results").innerHTML = "<div id='noresults'>Your search did not return any results.</div>";
			document.getElementById("loading").style.display="none";
			return;
		}
		
		var pre = 'of about <b>';
		var post = /<\/b>\.\s*\(<b>/;
		
		var resultPositionPre = responseText.search(pre) + pre.length;
		var resultPositionPost = responseText.search(post);
		var resultLength = resultPositionPost - resultPositionPre;
		
		var tResults  = responseText.substr(resultPositionPre, resultLength);
		
		while(tResults.search(',') != -1)
		{
			tResults = tResults.substr(0, tResults.search(',')) + tResults.substr(tResults.search(',') + 1, tResults.length);
		}
		
		if (isNaN(tResults) == false)
		{
			numOfPapers = tResults;
			getScholarResultsPart2(resultquery);
		}
		else 
		{
			//Need to search of 'of' instead of 'of about'.
			pre = 'of <b>';
			resultPositionPre = responseText.search(pre) + pre.length;
			resultLength = resultPositionPost - resultPositionPre;
			tResults = responseText.substr(resultPositionPre, resultLength);
			numOfPapers = tResults;
			getScholarResultsPart2(resultquery);
		}
	})
	.error(function() { alert("An error has occured"); return; })	.complete(function()
	{ });
}

function handleKeyPress(e,form)
{
	var key=e.keyCode;
	if (key==13)
	{
		getScholarResults(document.getElementById('searchbox').value);
	}
}

function getScholarResultsPart2(resultquery) {
	if (numOfPapers > 100) 
	{
		pages = (numOfPapers)/ret_results;
		counter = 0;
		if (pages < 10)
		{
			currentPage = 0;
			doCallForPagesLessThan10(resultquery);
		}
		else
		{
			currentPage = 0;
			doCallForPagesEqualTo10(resultquery);
		}
		setTimeout("wait()", 3000);
	}
	else
	{
		doCallForLessThan100Papers(resultquery);
	}
}

function wait() 
{ 
    if(done != true) 
    { 
        setTimeout("wait()", 3000); 
    } 
    else 
    { 
        totalCites(); 
    } 
    return; 
} 

function doCallForPagesLessThan10(resultquery)
{
	if(currentPage<=pages)
	{
		var begin = currentPage*100;
		var url = createURL(begin, resultquery);
		$.get(url, function(data) {
			if(data==null)
			{
			alert("There is no data");
			document.getElementById("loading").style.display="none";
			return;
			}
			 citePages[counter++] = getCitationCount(data);
			 getYearInformation(data);
			 currentPage = currentPage + 1;
			 doCallForPagesLessThan10(resultquery);
		})
		.error(function() { alert("There was an	 error"); return; });
	}
	else
	{
		done = true;
	}
}

function doCallForPagesEqualTo10(resultquery)
{
	//Starts at 0, goes to 9, therefore 10 pages
	if(currentPage<=9)
	{
		begin = currentPage*100;
		var url = createURL(begin, resultquery);
		$.get(url, function(data) {
			if(data==null)
			{
				alert("There is no data");
				document.getElementById("loading").style.display="none";
				return;
			}
			 citePages[counter++] = getCitationCount(data);
			 getYearInformation(data);
			 currentPage = currentPage + 1;
			 doCallForPagesLessThan10(resultquery);
		})
		.error(function() { alert("There was an error"); return; });	
	}
	else
	{
		done = true;
	}
}

function doCallForLessThan100Papers(resultquery)
{
	var url = "http://scholar.google.ca/scholar?q="+resultquery+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on";
	
	$.get(url, function(data) 
	{
		if(data==null)
		{
			alert("There is no data");
			document.getElementById("loading").
			style.display="none";
			return;
		}

		 citePages[0] = getCitationCount(data);
		 getYearInformation(data);
		 totalCites();
	})
	.error(function() 
	{ 
	alert("An error occured"); 
	return; 
	});
}


function getCitationCount(responseText){
	if (responseText == null)
	{
		alert("There is no data.");
		document.getElementById("loading").style.display="none";
		return;
	}
	
	var cite_exists = 1;
	var resultPositionPost = 0;
	var citeArray = new Array();
	
	for(var i = 0; cite_exists > 0; i++) 
	{
		cite_exists = responseText.indexOf("\">Cited by", resultPositionPost + 1);
		if(cite_exists == -1)
		{
		}
		else
		{
			var post = '</a>';
	        var resultPositionPre = cite_exists + '\">Cited by'.length + 1;
	        resultPositionPost = responseText.indexOf(post, resultPositionPre);
	        var resultLength = resultPositionPost - resultPositionPre;
	        var tmp_string = responseText.substr(resultPositionPre, resultLength);
			citeArray[i] = tmp_string;
			publications++;
		}
	}
	return citeArray;

}

function getYearInformation(responseText)
{
	if (responseText == null)
	{
		alert("There is no data.");
		document.getElementById("loading").style.display="none";
		return;
	}
	
	var year_string_exists = 1;
	var resultPositionPost = 0;
	
	for(var i = 0; year_string_exists > 0; i++) 
	{
		year_string_exists = responseText.indexOf('class=gs_a', resultPositionPost + 1);
		if(year_string_exists == -1)
		{
		}
		else
		{
			var post = '</span>';
			var resultPositionPre = year_string_exists + 'class=gs_a'.length + 1;
			resultPositionPost = responseText.indexOf(post, resultPositionPre);
			var smallstr = responseText.substring(resultPositionPre, resultPositionPost);
			var re = /(195|196|197|198|199|20)\d\d/;
			var m = re.exec(smallstr);
			if (m == null) 
			{
			} 
			else
			{
				if(m[0]< minyear && m[0]>1950 && m[0]<2015)
				{
					minyear = m[0];
				}
				if(m[0]>maxyear && m[0]<2015)
				{
					maxyear = m[0];
				}
			}
		}
	}
}

function totalCites()
{
    document.getElementById("loading").style.display="none";
    document.getElementById("abouttheapp").style.display="none";

    // Calculate the total number of citations from all fetched pages
    var total_citations = 0;
    
    for(var i = 0; i < citePages.length; i++){
        var citeArray = citePages[i];	        
	    for(var j = 0; j < citeArray.length; j++){
	        // Convert the string type into a numerical type
	        total_citations += citeArray[j]*1;
        }
    }

    var citeperpaper = total_citations/numOfPapers;
    citeperpaper = Math.round(citeperpaper*100)/100;
    var years = ((maxyear-minyear)+1);
    var citeperyear = total_citations/years;
    citeperyear = Math.round(citeperyear*100)/100;
    
    if(years==-9999){years="-";}
    var html = "<table id='resulttable' cellspacing='0'><tr><td id='tableleft'><strong style='font-size: 140%'>Total Papers:</strong> </td> <td id='tableright'>"+numOfPapers+"</td></tr>";
    html += "<tr><td id='tableleft'>Total Citations: </td> <td id='tableright'>"+total_citations+"</td></tr>";
    html += "<tr><td id='tableleft'>Citations per Paper: </td> <td id='tableright'>"+citeperpaper+"</td></tr>";
    html += "<tr><td id='tableleft'>Cited Publications: </td> <td id='tableright'>"+publications+"</td></tr>";
    html += "<tr><td id='tableleft'>h-index: </td> <td id='tableright'>"+h_index()+"</td></tr>";
    html += "<tr><td id='tableleft'>Years of Publications: </td> <td id='tableright'>"+years+"</td></tr>";
    html += "<tr><td id='tableleft'>Citations per Year: </td> <td id='tableright'>"+citeperyear+"</td></tr></table>";
    html += "<br/><br/><div id='viewpapersbutton' text-align:center ><input type='button' onclick=window.location.href='"+openpageurl+"' value='View Papers by the Author'/></div>";
    document.getElementById("results").innerHTML = html;

	//Gather statistics about the author
	var citeperpapter = total_citations/numOfPapers;
	citeperpaper = Math.round(citeperpaper*100)/100;
	var years = ((maxyear-minyear)+1);
	var citeperyear = total_citations/years;
	citeperyear = Math.round(citeperyear*100)/100;
	var hindex = h_index();
}

function h_index(){
    var hArray = new Array();
    var x = 0;
    for(var i = 0; i < citePages.length; i++){
        var citeArray = citePages[i];	        
	    for(var j = 0; j < citeArray.length; j++){
	        //Convert the string type into a numerical type
	        hArray[x++] = citeArray[j]*1;
        }
    }
    hArray.sort(sortNumber);

    var hindex = 0;
    for(var i = 0; i < hArray.length; i++){
        if(hArray[i]>=(i+1))
        {
        	hindex = (i+1);
        }
        else
        {
        	break;
        }
    }
    return hindex;
    
}
	
function sortNumber(a,b)
{
    return b - a;
}



function createURL(begin, rq)
{
	if(begin == 0)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=0";
	}
	if(begin == 100)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=100";
	}
	if(begin == 200)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=200";
	}
	if(begin == 300)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=300";
	}
	if(begin == 400)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=400";
	}
	if(begin == 500)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=500";
	}
	if(begin == 600)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=600";
	}
	if(begin == 700)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=700";
	}
	if(begin == 800)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=800";
	}	
	if(begin == 900)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=900";
	}
	if(begin == 1000)
	{
		return "http://scholar.google.ca/scholar?q="+rq+"&num="+ret_results+"&hl=en&btnG=Search&as_sdt=1%2C5&as_sdtp=on&start=1000";
	}
	return "";
}