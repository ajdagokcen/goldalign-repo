
/*****************************************************************************************
******************************************************************************************
******************************************************************************************
*****																				 *****
*****	GoldAlign:	a graphical interface for gold-standard corpus annotation		 *****
*****				of alignment and paraphrasing									 *****
*****	Copyright (C) 2016 Ajda Gokcen												 *****
*****																				 *****
*****	This file is part of GoldAlign.												 *****
*****																				 *****
*****	GoldAlign is free software: you can redistribute it and/or modify			 *****
*****	it under the terms of the GNU General Public License as published by		 *****
*****	the Free Software Foundation, either version 3 of the License, or			 *****
*****	(at your option) any later version.											 *****
*****																				 *****
*****	GoldAlign is distributed in the hope that it will be useful,				 *****
*****	but WITHOUT ANY WARRANTY; without even the implied warranty of				 *****
*****	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the				 *****
*****	GNU General Public License for more details.								 *****
*****																				 *****
*****	You should have received a copy of the GNU General Public License			 *****
*****	along with GoldAlign.  If not, see <http://www.gnu.org/licenses/>.			 *****
*****																				 *****
******************************************************************************************
******************************************************************************************
*****																				 *****
*****	GoldAlign, specifically in the file index.js, utilizes elements of			 *****
*****	Chris Callison-Burch’s word alignment tool:									 *****
*****																				 *****
*****		Zaidan, Omar, and Chris Callison-Burch. "Fast. Cheap and Creative: 		 *****
*****			Evaluating Translation Quality Using Amazon’s Mechanical Turk."		 *****
*****			Proceedings of the 2009 Conference on Empirical Methods in 			 *****
*****			Natural Language Processing. 2009.									 *****
*****			<https://www.aclweb.org/anthology/D/D09/D09-1030.pdf>.				 *****
*****		(see locally: pdf/callison-burch_2009.pdf)								 *****
*****																				 *****
*****		Callison-Burch, Chris, David Talbot, and Miles Osborne. 				 *****
*****			"Statistical machine translation with word-and sentence-aligned 	 *****
*****			parallel corpora." Proceedings of the 42nd Annual Meeting of the 	 *****
*****			Association for Computational Linguistics. 2004.					 *****
*****			<https://aclweb.org/anthology/P/P04/P04-1023.pdf>.					 *****
*****		(see locally: pdf/callison-burch_2004.pdf)								 *****
*****																				 *****
******************************************************************************************
******************************************************************************************
*****************************************************************************************/

/********** GLOBAL VARIABLES **********/

var socket = null;

/********** MISCELLANEOUS FUNCTIONS **********/

// Gets timestamp at submit time
function GetTimeStamp() {
	var date = new Date();
	var curdate = String(date.getFullYear()) + '/' + String(date.getMonth()+1) + '/' + String(date.getDate());
	var curtime = String(date.getHours()) + ':' + String(date.getMinutes()) + ':' + String(date.getSeconds());
	return curdate + "@" + curtime;
}

// TODO
// function CalculateAnnotatorAgreement()

/********** ALIGNMENT STRING & GRID HELPER FUNCTIONS **********/

function boolGridToString(grid) {
	var gridString = "";
	for (i in grid) {
		row = grid[i];
		for (j in row)
			if (grid[i][j])
				gridString += i + "-" + j + " ";
	}
	// remove the trailing space
	gridString = gridString.substring(0, gridString.length-1);
	return gridString;
}

function getAlignOverlap(as1, as2) {
	al1 = as1.split(/\s/);
	al2 = as2.split(/\s/);
	ret = [];
	for (pair in al1)
		if (al2.indexOf(al1[pair]) != -1 && ret.indexOf(al1[pair]) == -1)
			ret.push(al1[pair]);
	return ret.join(' ');
}

// Returns an initialized boolean grid.  Sets the points to true
// that are included in the alignmentString as "x-y".
function initializeBooleanGrid(width, height, alignmentString) {
	var grid = new Array(width);
	for (i = 0; i < grid.length; i++) {
		grid[i] = new Array(height);
		for (j = 0; j < height; j++) {
			grid[i][j] = false;
		}
	}
	// Set the points in alignmentString to true
	var points = alignmentString.split(/\s/);
	for (i = 0; i < points.length; i++) {
		if (points[i].indexOf('-') > 0) {
			var point = points[i].split('-');
			var x = point[0];
			var y = point[1];
			grid[x][y] = true;
		}
	}
	return grid;
}

// Returns an initialized boolean array
function initializeBooleanArray(length, indexOfTruesString) {
	// pad the indexOfTruesString with spaces
	indexOfTruesString = " " + indexOfTruesString + " ";
	var array = new Array(length);
	for (i = 0; i < array.length; i++) {
		array[i] = false;
	}

	// set the points in alignmentString to true
	var indicies = indexOfTruesString.split(/\s/);
	for (i = 0; i < indicies.length; i++) {
		var index = indicies[i];
		array[index] = true;
	}
	return array;
}

// calculated the longest word
function getLongestWord(words) {
	var max = 0;
	for (var i = 0; i < words.length; i++)
		if (max < words[i].offsetWidth)
			max = words[i].offsetWidth;
	return max;
}

function ToggleArbit() {
	Toggle('showarbit');
	if (Val('showarbit')) $('#arbit-toggle').text('Hide arbiter selections');
	else $('#arbit-toggle').text('Show arbiter selections');
	if (users.length != 1) {
		for (y in targetWords) for (x in sourceWords)
			if (arbitSureGrid[x][y] == true || arbitPossGrid[x][y] == true) {
				var button = $('#button\\.'+x+'\\.'+y);
				var clicky = (Val('editable')) ? ' clicky' : '';
				button.removeClass().addClass(getColorAt(x, y) + ' vOther' + clicky);
			}
	}
}

function getColorAt(x, y) {
	var color = 'white';
	if (users.length == 1) {
		if (sureGrid[x][y]) color = 'black';
		else if (possGrid[x][y]) color = 'gray';
	} else {
		if (Val('showarbit') && arbitSureGrid[x][y] == true) color = 'black';
		else if (Val('showarbit') && arbitPossGrid[x][y] == true) color = 'gray';
		else if (userASureGrid[x][y] == true) {
			if (userBSureGrid[x][y] == true) color = 'purple';
			else if (userBPossGrid[x][y] == true) color = 'redpurple';
			else color = 'red';
		} else if (userAPossGrid[x][y] == true) {
			if (userBSureGrid[x][y] == true) color = 'bluepurple';
			else if (userBPossGrid[x][y] == true) color  = 'lightpurple';
			else color = 'lightred';
		} else {
			if (userBSureGrid[x][y] == true) color = 'blue';
			else if (userBPossGrid[x][y] == true) color  = 'lightblue';
		}
	}
	return color;
}

function clickButton(x, y) {
	var button = $('#button\\.'+x+'\\.'+y);
	var classes = (Val('editable')) ? ' vOther clicky' : ' vOther';
	if (users.length == 1) {
		if (sureGrid[x][y] == false && possGrid[x][y] == false) {
			sureGrid[x][y] = true;
			possGrid[x][y] = false;
			button.removeClass().addClass(getColorAt(x, y) + classes);
		} else {
			if (possGrid[x][y] == false) {
				sureGrid[x][y] = false;
				possGrid[x][y] = true;
				button.removeClass().addClass(getColorAt(x, y) + classes);
			} else {
				sureGrid[x][y] = false;
				possGrid[x][y] = false;
				button.removeClass().addClass(getColorAt(x, y) + classes);
			}
		}
	} else {
		if (arbitSureGrid[x][y] == false && arbitPossGrid[x][y] == false) {
			arbitSureGrid[x][y] = true;
			arbitPossGrid[x][y] = false;
			button.removeClass().addClass(getColorAt(x, y) + classes);
		} else {
			if (arbitPossGrid[x][y] == false) {
				arbitSureGrid[x][y] = false;
				arbitPossGrid[x][y] = true;
				button.removeClass().addClass(getColorAt(x, y) + classes);
			} else {
				arbitSureGrid[x][y] = false;
				arbitPossGrid[x][y] = false;
				button.removeClass().addClass(getColorAt(x, y) + classes);
			}
		}
	}
}

/********** POPULATE WORKSPACE GRID **********/

// This method outputs the HTML table with clickable grid squares
// that are indexed into the sure and poss alignment boolean grids.
//function writeAlignmentGrid(sourceWords, targetWords, sureGrid, possGrid) {
function writeAlignmentGrid() {
	$('#word_table').empty();
	var smallerFont = false;
	var size = 27;
	var fontSize = 0;
	if (sourceWords.length > 20 || targetWords.length > 20) {
		size = 22;
		smallerFont = true;
		fontSize = -1;
	}

	var tmp = '<br /><table class="vOther" id="grid">';
	tmp += '<tr>';
	tmp += '<td class="vLeft"></td>';
	for (column in sourceWords) tmp += '<td class="vHead"><div class="vContent">' + sourceWords[column] + '</div></td>';
	tmp += '<td class="vRight"></td>';
	tmp += '</tr>';

	for (row in targetWords) {
		tmp += '<tr>';
		// print the target word
		tmp += '<td class="vLeft">';
		if (smallerFont) tmp += '<font size=' + fontSize + '>';
		tmp += targetWords[row];
		if (smallerFont) tmp += '</font>';
		tmp += '</td>';
		for (column in sourceWords) {
			tmp += '<td id="button.' + column + '.' + row + '" title="' + targetWords[row] + ', ' + sourceWords[column]+ '" class="' + getColorAt(column,row) + ' vOther';
			if (Val('editable')) tmp += ' clicky" onclick="clickButton('+column+','+row+')">';
			//tmp += '<td id="button.' + column + '.' + row + '" title="' + sourceWords[column] + ', ' + targetWords[row]+ '" class="' + getColorAt(column,row) + ' vOther';
			//if (Val('editable')) tmp += ' clicky" onclick="clickButton('+column+','+row+')">';
			else tmp += '">';
			tmp += '</td>';
		}
		// print the target word again
		tmp += '<td class="vRight">';
		if (smallerFont) tmp += '<font size=' + fontSize + '>';
		tmp += targetWords[row];
		if (smallerFont) tmp += '</font>';
		tmp += '</td>';
		tmp += '</tr>';
	}

	tmp += '<tr>';
	tmp += '<td class="vLeft"></td>';
	for (column in sourceWords) tmp += '<td class="vTail"><div class="vContent">'+ sourceWords[column] + '</div></td>';
	tmp += '<td class="vRight"></td>';
	tmp += '</tr>';
	tmp += '</table>';

	if (users.length != 1)
		if (Val('showarbit')) tmp += '<button class="btn btn-default btn-sm" id="arbit-toggle" onclick="ToggleArbit()">Hide arbiter selections</button>';
		else tmp += '<button class="btn btn-default btn-sm" id="arbit-toggle" onclick="ToggleArbit()">Show arbiter selections</button>';

	$('#word_table').append(tmp);
}

function writeGridTitle() {
	$('#grid_title').empty();
	var tmp = '<h3><b><i class="fa fa-pencil-square-o"></i> Pair #' + String(ind+1) + '</b></h3>';
	tmp += DatasetAndBatchWidget() + '<br />';
	$('#grid_title').append(tmp);
}

function writeFormButtons() {
	$('#form_buttons').empty();
	$('#form_buttons').append(BatchMenuWidget('Workspace') + '<br />');
}

function writeContextLinks(){
	$('#context_links').empty();
	var tmp = '<div class="panel list-group" id="context-panel">';
	tmp += '<a class="list-group-item list-group-item-info" data-toggle="collapse" data-target="#sm" data-parent="#menu" title="Context links"><i class="fa fa-link"></i> Contexts</a>';
    tmp += '<div id="sm" class="sublinks collapse">';
    tmp += '<a class="list-group-item small" title="Source (H) context" href="' + sourceLink + '">'+sourceString+'</a>';
	tmp += '<a class="list-group-item small" title="Target (V) context" href="' + targetLink + '">'+targetString+'</a>';
	tmp += '<a class="list-group-item list-group-item-info" title="All labels" onclick="window.open(\'data/context/' + dataset + '/all_labels.html\')"><i class="fa fa-list-ul"></i> See all labels</a>';
	tmp += '</div></div>';
	$('#context_links').append(tmp);
}


function writeMatchJudge() {
	$('#paraphrase_judge').empty();
	var IsOrNot = '';
	if (corpusParaphraseJudge == '1') IsOrNot = '<b>is</b>';
	else IsOrNot = 'is <b>not</b>';
	var tmp = '<br /><h4 title="Paraphrase judgment"> <i class="fa fa-question-circle"></i> '
	if (users.length == 1) {
		tmp += 'This pair ' + IsOrNot + ' marked as a paraphrase. Do you agree?</h4>';
		var PosClass = (userParaphraseJudge == '1') ? 'btn-primary' : 'btn-default';
		var NegClass = (userParaphraseJudge == '0') ? 'btn-primary' : 'btn-default';
		var PosOnClick = (Val('editable')) ? 'userParaphraseJudge=\'1\';' : '';
		var NegOnClick = (Val('editable')) ? 'userParaphraseJudge=\'0\';' : '';
	} else {
		tmp += 'This pair ' + IsOrNot + ' marked as a paraphrase. ';
		if (userAParaphraseJudge == corpusParaphraseJudge)
			if (userBParaphraseJudge == corpusParaphraseJudge) tmp += '<span class="emph purple">Both</span> users agree. ';
			else tmp += 'Only <span class="emph red">' + users[0] + '</span> agrees. ';
		else if (userBParaphraseJudge == corpusParaphraseJudge) tmp += 'Only <span class="emph blue">' + users[1] + '</span> agrees. ';
		else tmp += '<span class="emph gray">Neither</span> user agrees. ';
		tmp += 'Do you agree?</h4>';

		var PosClass = (arbitParaphraseJudge == '1') ? 'btn-primary' : 'btn-default';
		var NegClass = (arbitParaphraseJudge == '0') ? 'btn-primary' : 'btn-default';
		var PosOnClick = (Val('editable')) ? 'arbitParaphraseJudge=\'1\';' : '';
		var NegOnClick = (Val('editable')) ? 'arbitParaphraseJudge=\'0\';' : '';
	}

	if (!Val('editable')) { PosClass += ' disabled'; NegClass += ' disabled'; }

	tmp += '<div class="btn-group center btn-group-select">';
	tmp += '<button class="btn '+PosClass+'" id="is" onclick="'+PosOnClick+'">It <b>is</b> a paraphrase.</button>';
	tmp += '<button class="btn '+NegClass+'" id="not" onclick="'+NegOnClick+'">It is <b>not</b> a paraphrase.</button>';
	tmp += '</div>';

	$('#paraphrase_judge').append(tmp);
}

function writeCommentBox() {
	$('#comment_box').empty();
	var vb = (users.length == 1) ? 'comments' : 'arbitComments';
	var ro = (Val('editable')) ? '' : 'readonly ';
	if (users.length == 1) vb = 'comments';
	var tmp = '<br /><h4 title="Comments"><i class="fa fa-commenting fa-flip-horizontal"></i> Comments</h4>';
	tmp += '<textarea '+ro+'class="form-control" id="comments" name="comments" title="Comments" rows="2" wrap="hard" ';
	tmp += 'onclick="'+vb+'=$(\'#comments\').val();" onchange="'+vb+'=$(\'#comments\').val();" onkeyup="'+vb+'=$(\'#comments\').val();" onpaste="'+vb+'=$(\'#comments\').val();"';
	if (users.length == 1) tmp += '>' + comments.trim() + '</textarea>';
	else tmp += '>' + arbitComments.trim() + '</textarea>';
	$('#comment_box').append(tmp);
}

/********** POPULATE PAGES (AND NAVBAR) **********/

function WriteSettingsPage() {
	$('#settings_page').empty();
	var tmp = '<h3><b><i class="fa fa-cog"></i> Settings</b></h3><br />';
	for (var key in bools) {
		tmp += '<h4 title="'+bools[key][1]+'">'+key+' <i class="fa fa-question-circle"></i></h4>';
		var PosClass = (Val(key)) ? 'btn-primary' : 'btn-default';
		var NegClass = (!Val(key)) ? 'btn-primary' : 'btn-default';
		var disabled = (bools[key][2]) ? '' : 'disabled ish ';
		tmp += '<div class="btn-group btn-group-select center" title="'+bools[key][1]+'">';
		tmp += '<button class="btn '+disabled+PosClass+' setter" title="'+key+' on" onclick="Set(\''+key+'\',true);"><i class="fa fa-check"></i></button>';
		tmp += '<button class="btn '+disabled+NegClass+' setter" title="'+key+' off" onclick="Set(\''+key+'\',false);"><i class="fa fa-times"></i></button>';
		tmp += '</div><br />';
	}
	$('#settings_page').append(tmp);
}

// top right corner of menu
function writeUserDisplay() {
	$('#user_display').empty();
	var tmp = '<span class="usertext">';
	if (typeof users == 'undefined' || users.length <= 0)
		tmp += '<i class="fa fa-sign-in"></i> <b>Login</b>';
	else if (users.length == 1) {
		tmp += '<i class="fa fa-user"></i> annotator ';
		tmp += '<span class="user0">'+users[0]+'</span>';
	} else {
		tmp += '<i class="fa fa-users"></i> arbiter ';
		tmp += '<span class="subtext">for </span><span class="user1">'+users[0]+'</span>';
		tmp += '<span class="subtext"> & </span><span class="user2">'+users[1]+'</span>';
	}
	tmp += '</span>';
	$('#user_display').append(tmp);
}

// fa-user, fa-users, fa-user-plus, fa-user-times
function writeSelectionWidgets() {
	$('#selection_widgets').empty();
	var tmp = '<h3><b><i class="fa fa-home"></i> Configure workspace</b></h3><br />';
	tmp += '<div class="row">';
	tmp += '<label class="col-xs-6 control-label" for="taskselect"><h4><i>Task:</h4></i></label>';
	tmp += '<div class="col-xs-6 btn-group">';
	if (typeof task !== 'undefined' && tasklist.indexOf(task) >= 0)
		tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="taskselect">'+task+'</button>';
	else tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="taskselect"><i>select task</i> <i class="fa fa-caret-down"></i></button>';
	tmp += '<ul class="dropdown-menu">';
	for (i in tasklist) tmp += '<li onclick="$(\'#taskselect\').text(\''+tasklist[i]+'\');task=\''+tasklist[i]+'\';writeSelectionWidgets();"><a>'+tasklist[i]+'</a></li>';
	tmp += '</ul></div></div>';

	if (typeof task !== 'undefined' && task == 'annotate') {
		tmp += '<div class="row">';
		tmp += '<label class="col-xs-6 control-label" for="userselect"><h4><i>User:</h4></i></label>';
		tmp += '<div class="col-xs-6 btn-group">';
		if (typeof users !== 'undefined' && users.length > 0 && userlist.indexOf(users[0]) >= 0)
			tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="userselect">'+users[0]+'</button>';
		else tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="userselect"><i>select user</i> <i class="fa fa-caret-down"></i></button>';
		tmp += '<ul class="dropdown-menu">';
		for (i in userlist) tmp += '<li onclick="$(\'#userselect\').text(\''+userlist[i]+'\')"><a>'+userlist[i]+'</a></li>';
		tmp += '</ul></div></div>';
	}

	if (typeof task !== 'undefined' && task == 'arbitrate') {
		tmp += '<div class="row">';
		tmp += '<label class="col-xs-6 control-label" for="userselect1"><h4><i>User #1:</h4></i></label>';
		tmp += '<div class="col-xs-6 btn-group">';
		if (typeof users !== 'undefined' && users.length > 0 && userlist.indexOf(users[0]) >= 0)
			tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="userselect1">'+users[0]+'</button>';
		else tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="userselect1"><i>select user</i> <i class="fa fa-caret-down"></i></button>';
		tmp += '<ul class="dropdown-menu">';
		for (i in userlist) tmp += '<li onclick="$(\'#userselect1\').text(\''+userlist[i]+'\')"><a>'+userlist[i]+'</a></li>';
		tmp += '</ul></div></div>';
		tmp += '<div class="row">';
		tmp += '<label class="col-xs-6 control-label" for="userselect2"><h4><i>User #2:</h4></i></label>';
		tmp += '<div class="col-xs-6 btn-group">';
		if (typeof users !== 'undefined' && users.length > 1 && userlist.indexOf(users[1]) >= 0)
			tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="userselect2">'+users[1]+'</button>';
		else tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="userselect2"><i>select user</i> <i class="fa fa-caret-down"></i></button>';
		tmp += '<ul class="dropdown-menu">';
		for (i in userlist) tmp += '<li onclick="$(\'#userselect2\').text(\''+userlist[i]+'\')"><a>'+userlist[i]+'</a></li>';
		tmp += '</ul></div></div>';
	}

	if (typeof task !== 'undefined' && tasklist.indexOf(task) >= 0 && task != 'add user') {
		tmp += '<div class="row">';
		tmp += '<label class="col-xs-6 control-label" for="datasetselect"><h4><i>Dataset:</h4></i></label>';
		tmp += '<div class="col-xs-6 btn-group">';
		if (typeof dataset !== 'undefined' && datasetlist.indexOf(dataset) >= 0)
			tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="datasetselect">'+dataset+'</button>';
		else tmp += '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" id="datasetselect"><i>select dataset</i> <i class="fa fa-caret-down"></i></button>';
		tmp += '<ul class="dropdown-menu">';
		for (i in datasetlist) tmp += '<li onclick="$(\'#datasetselect\').text(\''+datasetlist[i]+'\')"><a>'+datasetlist[i]+'</a></li>';
		tmp += '</ul></div></div>';
	}

	tmp += '<br /><button class="btn btn-primary" title="Select configuration" onclick="RequestWhich(';
	if (task == 'annotate') tmp += '[$(\'#userselect\').text()]';
	else if (task == 'arbitrate') tmp += '[$(\'#userselect1\').text(), $(\'#userselect2\').text()]';
	else tmp += '[]';
	tmp += ', $(\'#datasetselect\').text());">Select</button>';
	$('#selection_widgets').append(tmp);
}

function writeIntroText() {
//	$('#intro_text').empty();
/*	if (users.length == 1) {
		var tmp = '<h3><b><i class="fa fa-book"></i> Word alignment annotation</b></h3>';
		tmp += '<p>The initial alignment that you see was created by a computer, and it contains errors.  Please correct it by clicking on the squares.  Use black boxes to indicate which words are in correspondence.  If there is not a direct correspondence (as in the case of a loose translation) please use the dark gray boxes.  If any of the computer\'s initial suggestions are wrong please uncheck them.</p>';
		tmp += '<p>Some words may not have any correspondence in the other sentence.  This is fine; simply leave the corresponding squares unchecked.</p>';
		tmp += '<p>Here is <span class="blacklink"><b><a href="javascript:window.open(\'http://cs.jhu.edu/~ccb/publications/paraphrase_guidelines.pdf\')">a full set of annotation guidelines</a></b></span> that gives details on tricky cases, plus <span class="blacklink"><b><a href="javascript:window.open(\'https://docs.google.com/document/d/1bHcCQKSUBklrWCtoi8HY5g7miRcPohOApcqFpzX9j8E/edit?usp=sharing\')">supplemental guidelines</a></b></span> by the creators of this tool.</p>';
		tmp += '<br /><br />';
		$('#intro_text').append(tmp);
		tmp = '<h3><b>Grid Color Key</b></h3><table>';
		tmp += '<tr><td><table class="key-col">';
		tmp += '<tr><td class="vLeft">User SURE</td><td class="black vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User POSS</td><td class="gray vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">No selection</td><td class="white vOther"></td></tr>';
		tmp += '</table></td></tr>';
		tmp += '</table>';
		$('#intro_text').append(tmp);
	} else {
		var tmp = '<h3><b><i class="fa fa-book"></i> Word alignment arbitration</b></h3>';
		tmp += '<p>Please finalize this word alignment by arbitrating the annotations of the two annotators.  Note: you can make other corrections to it, too.</p>';
		tmp += '<p>Some words may not have any correspondence in the other sentence.  This is fine; simply leave the corresponding squares unchecked.</p>';
		tmp += '<p>Here is <span class="blacklink"><b><a href="javascript:window.open(\'http://cs.jhu.edu/~ccb/publications/paraphrase_guidelines.pdf\')">a full set of annotation guidelines</a></b></span> that gives details on tricky cases, plus <span class="blacklink"><b><a href="javascript:window.open(\'https://docs.google.com/document/d/1bHcCQKSUBklrWCtoi8HY5g7miRcPohOApcqFpzX9j8E/edit?usp=sharing\')">supplemental guidelines</a></b></span> by the creators of this tool.</p>';
		tmp += '<br /><br />';
		$('#intro_text').append(tmp);
		tmp = '<h3><b>Grid Color Key</b></h3><table>';
		tmp += '<tr><td><table class="key-col">';
		tmp += '<tr><td class="vLeft">Arbiter SURE</td><td class="black vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">Arbiter POSS</td><td class="gray vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">No selection</td><td class="white vOther"></td></tr>';
		tmp += '</table></td><td><table class="key-col">';
		tmp += '<tr><td class="vLeft">User A-only SURE</td><td class="red vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User A SURE, User B POSS</td><td class="redpurple vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">Both users SURE</td><td class="purple vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User A POSS, User B SURE</td><td class="bluepurple vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User B-only SURE</td><td class="blue vOther"></td></tr>';
		tmp += '</table></td><td><table class="key-col">';
		tmp += '<tr><td class="vLeft">User A-only POSS</td><td class="lightred vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">Both users POSS</td><td class="lightpurple vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User B-only POSS</td><td class="lightblue vOther"></td></tr>';
		tmp += '</table></td></tr>';
		tmp += '</table>';
		$('#intro_text').append(tmp);
	}
*/
/*	var tmp = '<h3><b><i class="fa fa-book"></i> Word alignment task guide</b></h3><br>';
	tmp += '<div class="panel-group" id="accordion">';

	tmp += '<div class="panel list-group" id="info-panel-one">';
	tmp += '<a class="list-group-item list-group-item-info" data-toggle="collapse" data-target="#infoone" data-parent="#accordion" title="Task:Annotation">Task: Annotation</a>';
    tmp += '<div id="infoone" class="sublinks collapse in">';
    tmp += '<div class="list-group-item small" title="">';
		tmp += '<h3>Task Instructions</h3>';
		tmp += '<p>The initial alignment that you see was created by a computer, and it contains errors.  Please correct it by clicking on the squares.  Use black boxes to indicate which words are in correspondence.  If there is not a direct correspondence (as in the case of a loose translation) please use the dark gray boxes.  If any of the computer\'s initial suggestions are wrong please uncheck them.</p>';
		tmp += '<p>Some words may not have any correspondence in the other sentence.  This is fine; simply leave the corresponding squares unchecked.</p>';
		tmp += '<p>Here is <span class="blacklink"><b><a href="javascript:window.open(\'http://cs.jhu.edu/~ccb/publications/paraphrase_guidelines.pdf\')">a full set of annotation guidelines</a></b></span> that gives details on tricky cases, plus <span class="blacklink"><b><a href="javascript:window.open(\'https://docs.google.com/document/d/1bHcCQKSUBklrWCtoi8HY5g7miRcPohOApcqFpzX9j8E/edit?usp=sharing\')">supplemental guidelines</a></b></span> by the creators of this tool.</p>';
	tmp += '</div>';
    tmp += '<div class="list-group-item small" title="">';
		tmp += '<h3>Grid Color Key</h3><table>';
		tmp += '<tr><td><table class="key-col">';
		tmp += '<tr><td class="vLeft">User SURE</td><td class="black vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User POSS</td><td class="gray vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">No selection</td><td class="white vOther"></td></tr>';
		tmp += '</table></td></tr>';
		tmp += '</table>';
	tmp += '</div>';
	//tmp += '<div class="list-group-item small" title="Target (V) context">yoyo</div>';
	//tmp += '<a class="list-group-item list-group-item-info" title="All labels" onclick="window.open(\'data/context/' + dataset + '/all_labels.html\')"><i class="fa fa-list-ul"></i> See all labels</a>';
	tmp += '</div></div>';

	tmp += '<div class="panel list-group" id="info-panel-two">';
	tmp += '<a class="list-group-item list-group-item-info" data-toggle="collapse" data-target="#infotwo" data-parent="#accordion" title="Instructions/Help">Task: Arbitration</a>';
    tmp += '<div id="infotwo" class="sublinks collapse">';
    tmp += '<div class="list-group-item small" title="">';
		tmp += '<h3>Task Instructions</h3>';
		tmp += '<p>Please finalize this word alignment by arbitrating the annotations of the two annotators.  Note: you can make other corrections to it, too.</p>';
		tmp += '<p>Some words may not have any correspondence in the other sentence.  This is fine; simply leave the corresponding squares unchecked.</p>';
		tmp += '<p>Here is <span class="blacklink"><b><a href="javascript:window.open(\'http://cs.jhu.edu/~ccb/publications/paraphrase_guidelines.pdf\')">a full set of annotation guidelines</a></b></span> that gives details on tricky cases, plus <span class="blacklink"><b><a href="javascript:window.open(\'https://docs.google.com/document/d/1bHcCQKSUBklrWCtoi8HY5g7miRcPohOApcqFpzX9j8E/edit?usp=sharing\')">supplemental guidelines</a></b></span> by the creators of this tool.</p>';
	tmp += '</div>';
    tmp += '<div class="list-group-item small" title="">';
		tmp += '<h3>Grid Color Key</h3><table>';
		tmp += '<tr><td><table class="key-col">';
		tmp += '<tr><td class="vLeft">Arbiter SURE</td><td class="black vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">Arbiter POSS</td><td class="gray vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">No selection</td><td class="white vOther"></td></tr>';
		tmp += '</table></td><td><table class="key-col">';
		tmp += '<tr><td class="vLeft">User A-only SURE</td><td class="red vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User A SURE, User B POSS</td><td class="redpurple vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">Both users SURE</td><td class="purple vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User A POSS, User B SURE</td><td class="bluepurple vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User B-only SURE</td><td class="blue vOther"></td></tr>';
		tmp += '</table></td><td><table class="key-col">';
		tmp += '<tr><td class="vLeft">User A-only POSS</td><td class="lightred vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">Both users POSS</td><td class="lightpurple vOther"></td></tr>';
		tmp += '<tr><td class="vLeft">User B-only POSS</td><td class="lightblue vOther"></td></tr>';
		tmp += '</table></td></tr>';
		tmp += '</table>';
	tmp += '</div>';
	tmp += '</div></div>';

	tmp += '</div>';
	$('#intro_text').append(tmp);
*/
}

function writeDatasetNavigation() {
	$('#dataset_navigation').empty();
	var pag = Paginate(DatasetIncrement,'DatasetIncrement',DatasetIndex,'DatasetIndex',batches.length,workingBatchInd,'writeDatasetNavigation();');
	var tmp = '<h3><b><i class="fa fa-compass"></i> Dataset navigation</b></h3>';
	tmp += DatasetAndBatchWidget() + '<br />';

	// TODO:	figure out how to do filtration stuff properly
	//			badges/labels for # in each category!
	tmp += '<table class="hovery dataset">';
	for (var i = pag.MinIndOnPage; i < pag.MaxIndOnPage; i++) {
		if (i == workingBatchInd) {
			tmp += '<tr class="selected"><th>' + batches[i] + '</th>';
			tmp += '<td class="main clicky" onclick="MakeVisible(\'Workspace\');">';
			if (Val('editable')) {
				tmp += fa('pencil')+' UNDERWAY</td>';
				tmp += '<td><div class="btn-group center">'

				tmp += '<div class="btn-group center">';
					tmp += '<button class="btn btn-primary dropdown-toggle" title="Closing options" type="button" data-toggle="dropdown">'+opt('primary','close')+'</button>';
					tmp += '<ul class="dropdown-menu dropdown-menu-right">';
					tmp += '<li onclick="Submit()"><a>'+fa('check')+' Submit & close</a></li>';
					tmp += '<li onclick="SaveClose()"><a>'+fa('floppy-o')+' Save & close</a></li>';
					tmp += '<li onclick="CleanSlate()"><a>'+fa('trash')+' Discard</a></li>';
				tmp += '</ul></div>';
				tmp += '<button class="btn btn-primary" title="Switch to read-only mode" onclick="LoadFromBase();Toggle(\'editable\');writeDatasetNavigation();writeBatchNavigation();Draw();">'+fa('eye')+'</button>';
				tmp += '</div></td>';
			} else {
				tmp += fa('eye')+' READ-ONLY</td>';
				tmp += '<td><div class="btn-group center">'
				tmp += '<button class="btn btn-primary" title="Close" onclick="CleanSlate()">'+fa('close')+'</button>';
				tmp += '<button class="btn btn-primary" title="Switch to edit mode" onclick="Toggle(\'editable\');writeDatasetNavigation();writeBatchNavigation();Draw();">'+fa('pencil')+'</button>';
				tmp += '</div></td>';
			}
		} else if (users.length == 1 || (users.length != 1 && completion[i][2] == 1 && completion[i][3] == 1)) {
			// no
			if (completion[i][1] == 1) {
				tmp += '<tr class="complete"><th>' + batches[i] + '</th><td class="main">';
				tmp += fa('check')+' COMPLETE</td>';
				tmp += '<td><div class="btn-group center">'

				tmp += '<div class="btn-group center">';
					tmp += '<button class="btn btn-default dropdown-toggle" title="Editing options" type="button" data-toggle="dropdown">'+opt('default','pencil')+'</button>';
					tmp += '<ul class="dropdown-menu dropdown-menu-right">';
					tmp += '<li onclick="SelectBatch('+i+',2,true);"><a>'+fa('play')+' Resume editing from final</a></li>';
					tmp += '<li onclick="SelectBatch('+i+',0,true);"><a>'+fa('refresh')+' Restart editing from original</a></li>';
				tmp += '</ul></div>';
				tmp += '<div class="btn-group center">';
					tmp += '<button class="btn btn-default dropdown-toggle" title="Read-only options" type="button" data-toggle="dropdown">'+opt('default','eye')+'</button>';
					tmp += '<ul class="dropdown-menu dropdown-menu-right">';
					tmp += '<li onclick="SelectBatch('+i+',2,false);"><a>'+fa('play')+' View final as read-only</a></li>';
					tmp += '<li onclick="SelectBatch('+i+',0,false);"><a>'+fa('refresh')+' View original as read-only</a></li>';
				tmp += '</ul></div>';

				tmp += '</div></td>';
			} else if (completion[i][0] == 1) {
				tmp += '<tr class="incomplete"><th>' + batches[i] + '</th>';
				tmp += '<td class="main clicky" onclick="SelectBatch('+i+',1,true);">';
				tmp += '<i class="fa fa-exclamation-circle"></i> INCOMPLETE</td>';
				tmp += '<td><div class="btn-group center">'

				tmp += '<div class="btn-group center">';
					tmp += '<button class="btn btn-default dropdown-toggle" title="Editing options" type="button" data-toggle="dropdown">'+opt('default','pencil')+'</button>';
					tmp += '<ul class="dropdown-menu dropdown-menu-right">';
					tmp += '<li onclick="SelectBatch('+i+',1,true);"><a>'+fa('play')+' Resume editing from latest</a></li>';
					tmp += '<li onclick="SelectBatch('+i+',0,true);"><a>'+fa('refresh')+' Restart editing from original</a></li>';
				tmp += '</ul></div>';
				tmp += '<div class="btn-group center">';
					tmp += '<button class="btn btn-default dropdown-toggle" title="Read-only options" type="button" data-toggle="dropdown">'+opt('default','eye')+'</button>';
					tmp += '<ul class="dropdown-menu dropdown-menu-right">';
					tmp += '<li onclick="SelectBatch('+i+',1,false);"><a>'+fa('play')+' View latest as read-only</a></li>';
					tmp += '<li onclick="SelectBatch('+i+',0,false);"><a>'+fa('refresh')+' View original as read-only</a></li>';
				tmp += '</ul></div>';

				tmp += '</div></td>';
			} else {
				tmp += '<tr class="unstarted"><th>' + batches[i] + '</th>';
				tmp += '<td class="main clicky" onclick="SelectBatch('+i+',0,true);">';
				tmp += '<i class="fa fa-exclamation-circle"></i> UNSTARTED</td>';
				tmp += '<td><div class="btn-group center">'
				tmp += '<button class="btn btn-default" title="Begin editing" onclick="SelectBatch('+i+',0,true);">'+fa('play')+'</button>';
				tmp += '<button class="btn btn-default" title="View as read-only" onclick="SelectBatch('+i+',0,false);">'+fa('eye')+'</button>';
				tmp += '</div></td>';
			}
		} else {
			tmp += '<tr class="notready"><th>' + batches[i] + '</th><td class="main">';
			tmp += '<i class="fa fa-ban"></i> NOT READY</td>';
			tmp += '<td><div class="btn-group center">'
			tmp += '<button class="btn btn-link disabled"></button>';
			tmp += '<button class="btn btn-link disabled"></button>';
			tmp += '</div></td>';
		}
		tmp += '</tr>'
	}
	tmp += '</table>';

	tmp += '<br />' + pag.Pagination + pag.PerPage;
	$('#dataset_navigation').append(tmp);
}

function writeBatchNavigation() {
	$('#batch_navigation').empty();
	var pag = Paginate(ProgressIncrement,'ProgressIncrement',ProgressIndex,'ProgressIndex',base.length,ind,'writeBatchNavigation();');
	var tmp = '<h3><b><i class="fa fa-list"></i> Batch navigation</b></h3>';
	tmp += DatasetAndBatchWidget() + '<br />';
	tmp += BatchMenuWidget('Batch');
	tmp += '<br /><table class="hovery">';
	for (var i = pag.MinIndOnPage; i < pag.MaxIndOnPage; i++) {
		if (ind == i) tmp += '<tr class="clicky selected" title="See pair #'+(eval(i)+1)+' in Workspace" onclick="MakeVisible(\'Workspace\');">';
		else tmp += '<tr class="clicky" title="Select pair #'+(eval(i)+1)+'" onclick="GoToDataPoint('+i+');">';
		tmp += '<th>'
		tmp += 'Pair #' + (eval(i)+1) + '</th>';
		tmp += '<td>';
		tmp += '<p>' + base[i][1] + '</p>';
		tmp += '<p>' + base[i][3] + '</p>';
		tmp += '</td></tr>';
	}
	tmp += '</table>';

	tmp += '<br />' + pag.Pagination + pag.PerPage;
	$('#batch_navigation').append(tmp);
}

/********** VARIOUS PAGE DRAWING HELPER FUNCTIONS & WIDGETS  **********/

function fa(glyph) {
	return '<span class="fa-stack fa-1x"><i class="fa fa-'+glyph+' fa-stack-1x fa-fw" style="top:-1px"></i></span>';
}

function fa2(glyph) {
	return '<i class="fa fa-'+glyph+' fa-fw"></i>';
}

function opt(type, glyph) {
	var color = (type == 'default') ? '#666666' : 'white';
	return '<span class="fa-stack fa-1x"><i class="fa fa-cog fa-stack-1x fa-fw" style="color:'+color+'; font-size:175%; opacity:0.3; top:0px"></i><i class="fa fa-'+glyph+' fa-stack-1x fa-fw" style="top:-1px"></i></span>';
}

// used in Dataset, Batch, Workspace
function DatasetAndBatchWidget() {
	var tmp = '<div class="row" title="Current dataset" style="margin:1px 0px; vertical-align:middle">';
	tmp += '<div class="col-xs-6" style="text-align:right; padding-right:5px; font-variant:small-caps"><b><i>Dataset:</i></b></div>';
	tmp += '<div class="col-xs-6" style="text-align:left; padding-left:5px; max-width:380px">';
	tmp += '<i>'+dataset+'</i></div></div>';
	tmp += '<div class="row" title="Current batch" style="margin:1px 0px; vertical-align:middle">';
	tmp += '<div class="col-xs-6" style="text-align:right; padding-right:5px; font-variant:small-caps"><b><i>Batch:</i></b></div>';
	tmp += '<div class="col-xs-6" style="text-align:left; padding-left:5px; max-width:380px">';
	if (workingBatchInd >= 0) tmp += '<i>'+batches[workingBatchInd]+'</i>';
	else tmp += '<i>no batch selected</i>';
	tmp += '</div></div>';
	return tmp;
}

// used in Dataset, Batch
function Paginate(InputInc,IncName,InputIndex,IndexName,InputSize,ActiveInd,CallbackName) {
	var tmpInc = (InputInc > 0) ? InputInc : ((InputSize > 0) ? InputSize : 1);
	var TotalPages = Math.ceil(InputSize/tmpInc);
	InputIndex = Math.min(TotalPages,Math.max(0,InputIndex));
	var MinIndOnPage = InputIndex*tmpInc;
	var MaxIndOnPage = Math.min( (InputIndex + 1)*tmpInc , InputSize );
	var PageNum = '<h5><i>Page ' + (InputIndex+1) + ' of ' + TotalPages + ' | Showing batches ' + (MinIndOnPage+1) + '-' + MaxIndOnPage + ' of ' + InputSize + '</i></h5>';
	return {
		Pagination : PaginationWidget(InputIndex,IndexName,InputSize,CallbackName,TotalPages) + PageNum,
		PerPage : PerPageWidget(tmpInc,IncName,IndexName,InputSize,ActiveInd,CallbackName),
		MinIndOnPage : MinIndOnPage,
		MaxIndOnPage : MaxIndOnPage
	};
}

function PaginationWidget(InputIndex,IndexName,InputSize,CallbackName,TotalPages) {
	var MinPageButton = (InputIndex >= 2) ? (InputIndex-2) : ((InputIndex >= 1) ? InputIndex-1 : InputIndex);
	var MaxPageButton = (InputIndex < TotalPages-2) ? (InputIndex+2) : ((InputIndex < TotalPages-1) ? InputIndex+1 : InputIndex);
	var tmp = '<div class="btn-group center">';
	if (InputIndex > 0) {
		tmp += '<button class="btn btn-default sq-sm" title="First page" onclick="'+IndexName+'=0;'+CallbackName+'window.scrollTo(0,0);"><i class="fa fa-fast-backward"></i></button>';
		tmp += '<button class="btn btn-default sq-sm" title="Previous page" onclick="'+IndexName+'='+(InputIndex-1)+';'+CallbackName+'window.scrollTo(0,0);"><i class="fa fa-step-backward"></i></button>';
		tmp += '&nbsp;&nbsp;';
		if (InputIndex <= 1) tmp += '<button class="btn btn-link disabled sq-sm"></button>';
	} else {
		tmp += '<button class="btn btn-default disabled ish sq-sm" title="First page"><i class="fa fa-fast-backward"></i></button>';
		tmp += '<button class="btn btn-default disabled ish sq-sm" title="Previous page"><i class="fa fa-step-backward"></i></button>';
		tmp += '&nbsp;&nbsp;';
		tmp += '<button class="btn btn-link disabled sq-sm"></button>';
		if (InputIndex <= 1) tmp += '<button class="btn btn-link disabled sq-sm"></button>';
	}
	for (var j = MinPageButton; j <= MaxPageButton; j++)
		if (j == InputIndex) tmp += '<button class="btn btn-primary sq-sm" title="Page '+(j+1)+'">'+(j+1)+'</button>';
		else tmp += '<button class="btn btn-info sq-sm" title="Page '+(j+1)+'" onclick="'+IndexName+'='+j+';'+CallbackName+'window.scrollTo(0,0);">'+(j+1)+'</button>';
	if (InputIndex < TotalPages-1) {
		if (InputIndex >= TotalPages-2) tmp += '<button class="btn btn-link disabled sq-sm"></button>';
		tmp += '&nbsp;&nbsp;';
		tmp += '<button class="btn btn-default sq-sm" title="Next page" onclick="'+IndexName+'='+(InputIndex+1)+';'+CallbackName+'window.scrollTo(0,0);"><i class="fa fa-step-forward"></i></button>';
		tmp += '<button class="btn btn-default sq-sm" title="Last page" onclick="'+IndexName+'='+(TotalPages-1)+';'+CallbackName+'window.scrollTo(0,0);"><i class="fa fa-fast-forward"></i></button>';
	} else {
		tmp += '<button class="btn btn-link disabled sq-sm"></button>';
		if (InputIndex >= TotalPages-2) tmp += '<button class="btn btn-link disabled sq-sm"></button>';
		tmp += '&nbsp;&nbsp;';
		tmp += '<button class="btn btn-default disabled ish sq-sm" title="Next page"><i class="fa fa-step-forward"></i></button>';
		tmp += '<button class="btn btn-default disabled ish sq-sm" title="Last page"><i class="fa fa-fast-forward"></i></button>';
	}
	tmp += '</div>';
	return tmp;
}

function PerPageWidget(InputInc,IncName,IndexName,InputSize,ActiveInd,CallbackName) {
	var x = ['5','10','25','50','100'];
	var tmp = '<h5>Show <div class="btn-group dropup center" style="display:inline-block">';
	if (InputInc == InputSize)
		tmp += '<button class="btn btn-default btn-sm dropdown-toggle" type="button" data-toggle="dropdown" id="datasetinc">all <i class="fa fa-caret-up"></i></button>';
	else tmp += '<button class="btn btn-default btn-sm dropdown-toggle" type="button" data-toggle="dropdown" id="datasetinc">'+InputInc+' <i class="fa fa-caret-up"></i></button>';
	tmp += '<ul class="dropdown-menu perpage">';
	for (i in x) {
		var ActivePage = (ActiveInd >= 0 && ActiveInd < InputSize) ? Math.floor(ActiveInd/x[i]) : 0;
		tmp += '<li onclick="$(\'#datasetinc\').text('+x[i]+');'+IndexName+'='+ActivePage+';'+IncName+'='+x[i]+';'+CallbackName+'"><a onclick="window.scrollTo(0,0);">'+x[i]+'</a></li>';
	}
	tmp += '<li onclick="$(\'#datasetinc\').text(\'all\');'+IndexName+'='+ActivePage+';'+IncName+'=-1;'+CallbackName+'"><a onclick="window.scrollTo(0,0);">all</a></li>';
	tmp += '</ul></div> per page</h5>';
	return tmp;
}

// used in Batch and Workspace
function BatchMenuWidget(page) {
	var tmp = '<div class="btn-group center">';
	tmp += '<button class="btn btn-default sq-sm" title="Previous pair" onclick="GoToDataPoint(-2)"><i class="fa fa-arrow-left"></i></button>';
	tmp += '<div class="btn-group center">';
	if (Val('editable')) tmp += '<button class="btn btn-primary dropdown-toggle sq-sm menu-btn '+page+'" title="Editing options" type="button" data-toggle="dropdown">'+opt('primary','pencil')+'</button>';
	else tmp += '<button class="btn btn-primary dropdown-toggle sq-sm menu-btn '+page+'" title="Read-only options" type="button" data-toggle="dropdown">'+opt('primary','eye')+'</button>';
	tmp += '<ul class="dropdown-menu dropdown-menu-center rc-menu '+page+'" style="font-size:small">';
	if (Val('editable')) {
		tmp += '<li onclick="SaveProgress()"><a><i class="fa fa-floppy-o"></i> Save & continue</a></li>';
		tmp += '<li class="divider"></li>';
		tmp += '<li class="dropdown-header"><font color="black"><b><i class="fa fa-arrow-right"></i> Close & go to next batch</b></font></li>';
		tmp += '<li onclick="SubmitAndProceed()"><a><i class="fa fa-check"></i> Submit</a></li>';
		tmp += '<li onclick="SaveAndProceed()"><a><i class="fa fa-floppy-o"></i> Save</a></li>';
		tmp += '<li onclick="DiscardAndProceed()"><a><i class="fa fa-trash"></i> Discard</a></li>';
		tmp += '<li class="divider"></li>';
		tmp += '<li class="dropdown-header"><font color="black"><b><i class="fa fa-compass"></i> Close & return to Dataset Nav</b></font></li>';
		tmp += '<li onclick="Submit();MakeVisible(\'Dataset\');"><a><i class="fa fa-check"></i> Submit</a></li>';
		tmp += '<li onclick="SaveClose();MakeVisible(\'Dataset\');"><a><i class="fa fa-floppy-o"></i> Save</a></li>';
		tmp += '<li onclick="CleanSlate();MakeVisible(\'Dataset\');"><a><i class="fa fa-trash"></i> Discard</a></li>';
		tmp += '<li class="divider"></li>';
		tmp += '<li onclick="LoadFromBase();Toggle(\'editable\');writeDatasetNavigation();writeBatchNavigation();Draw();"><a><i class="fa fa-eye"></i> Read-only mode</a></li>';
	} else {
		tmp += '<li onclick="DiscardAndProceed()"><a><i class="fa fa-arrow-right"></i> Close & open next batch</a></li>';
		tmp += '<li onclick="CleanSlate();MakeVisible(\'Dataset\');"><a><i class="fa fa-compass"></i> Close & go to Dataset Nav</a></li>';
		tmp += '<li class="divider"></li>';
		tmp += '<li onclick="Toggle(\'editable\');writeDatasetNavigation();writeBatchNavigation();Draw();"><a><i class="fa fa-pencil"></i> Edit mode</a></li>';
	}
	tmp += '<li class="divider"></li>';
	if (page == 'Batch') tmp += '<li onclick="MakeVisible(\'Workspace\');"><a><i class="fa fa-pencil-square-o"></i> Go to Workspace</a></li>';
	else if (page == 'Workspace') tmp += '<li onclick="MakeVisible(\'Batch\');"><a><i class="fa fa-list"></i> Go to Batch Nav</a></li>';
	tmp += '</ul></div>';
	tmp += '<button class="btn btn-default sq-sm" title="Next pair" onclick="GoToDataPoint(-1)"><i class="fa fa-arrow-right"></i></button>';
	tmp += '</div>';
	return tmp;
}

/********** DATA STRUCTURE NAVIGATION **********/

function ReadBatchStructure(){
	socket.emit('ReadBatchStructure', [users, dataset]);
}

function SelectBatch(batchind, option, editableVar) {
	Set('editable', editableVar);
	ReadBatchStructure();
	workingBatchInd = batchind;
	DatasetIndex = Math.floor(workingBatchInd/DatasetIncrement);
	ProgressIndex = 0;
	writeDatasetNavigation();
	$('#mBatch').show();
	$('#mWorkspace').show();
	socket.emit('ReadWorkingBatch', [users, dataset, batches[workingBatchInd], option]);
}

function GoToDataPoint(newind){
	if (typeof ind !== 'undefined') {
		if (Val('editable'))
			if (Val('autosave')) SaveProgress();
			else UpdateMod();
		if (newind == -1) {
			if (ind < mod.length-1) ind += 1;
			else ind = 0;
		} else if (newind == -2) {
			if (ind > 0) ind -= 1;
			else ind = mod.length-1;
		} else if (newind != null) ind = newind;
		LoadFromMod();
		ProgressIndex = Math.floor(ind/ProgressIncrement);
		writeBatchNavigation();
		//MakeVisible('Workspace');
	}
}

function Flush() {
	$('#grid_title').empty();
	$('#form_buttons').empty();
	$('#context_links').empty();
	$('#word_table').empty();
	$('#paraphrase_judge').empty();
	$('#comment_box').empty();
}

function Populate() {
	writeGridTitle();
	writeFormButtons();
	writeContextLinks();
	writeAlignmentGrid();
	writeMatchJudge();
	writeCommentBox();
}

function Draw() {
	Flush();
	Populate();
}

function CleanSlate() {
	Flush();
	delete base;
	delete mod;
	delete ind;
	delete pairID;
	delete sourceString;
	delete sourceLink;
	delete targetString;
	delete targetLink;
	delete corpusParaphraseJudge;
	if (users.length == 1) {
		delete userParaphraseJudge;
		delete sureAlignments;
		delete possAlignments;
		delete comments;
	} else {
		delete userAParaphraseJudge;
		delete userASureAlignments;
		delete userAPossAlignments;
		delete userAComments;
		delete userBParaphraseJudge;
		delete userBSureAlignments;
		delete userBPossAlignments;
		delete userBComments;
		delete arbitParaphraseJudge;
		delete arbitSureAlignments;
		delete arbitPossAlignments;
		delete arbitComments;
	}
	$('#batch_navigation').empty();
	$('#batch_navigation').append('<h3><i>There is currently no batch in progress.</i></h3>');
	$('#grid_title').append('<h3><i>There is currently no batch in progress.</i></h3>');
	$('#mBatch').hide();
	$('#mWorkspace').hide();
	workingBatchInd = -1;
	//DatasetIndex = 0;
	ProgressIndex = 0;
	writeDatasetNavigation();
	//MakeVisible('Dataset');
}

function UpdateBase() {
	if (users.length == 1) {
		base[ind][6] = userParaphraseJudge;
		base[ind][7] = boolGridToString(sureGrid);
		base[ind][8] = boolGridToString(possGrid);
		base[ind][9] = comments.replace(/\n/g,'&#10;').trim();
	} else {
		base[ind][8][0] = arbitParaphraseJudge;
		base[ind][8][1] = boolGridToString(arbitSureGrid);
		base[ind][8][2] = boolGridToString(arbitPossGrid);
		base[ind][8][3] = arbitComments.replace(/\n/g,'&#10;').trim();
	}
}

function UpdateMod() {
	if (users.length == 1) {
		mod[ind][6] = userParaphraseJudge;
		mod[ind][7] = boolGridToString(sureGrid);
		mod[ind][8] = boolGridToString(possGrid);
		mod[ind][9] = comments.replace(/\n/g,'&#10;').trim();
	} else {
		mod[ind][8][0] = arbitParaphraseJudge;
		mod[ind][8][1] = boolGridToString(arbitSureGrid);
		mod[ind][8][2] = boolGridToString(arbitPossGrid);
		mod[ind][8][3] = arbitComments.replace(/\n/,'&#10;').trim();
	}
}

function Load() {
	sourceWords = sourceString.split(/\s/);
	targetWords = targetString.split(/\s/);
	width = sourceWords.length;
	height = targetWords.length;
	if (users.length == 1) {
		sureGrid = initializeBooleanGrid(width, height, sureAlignments);
		possGrid = initializeBooleanGrid(width, height, possAlignments);
	} else {
		userASureGrid = initializeBooleanGrid(width, height, userASureAlignments);
		userAPossGrid = initializeBooleanGrid(width, height, userAPossAlignments);
		userBSureGrid = initializeBooleanGrid(width, height, userBSureAlignments);
		userBPossGrid = initializeBooleanGrid(width, height, userBPossAlignments);
		arbitSureGrid = initializeBooleanGrid(width, height, arbitSureAlignments);
		arbitPossGrid = initializeBooleanGrid(width, height, arbitPossAlignments);
	}
}

function LoadFromMod() {
	if (typeof ind !== 'undefined') {
		pairID = mod[ind][0];
		sourceString = mod[ind][1];
		if (['','#'].indexOf(mod[ind][2].trim()) <= -1) sourceLink = 'javascript:window.open(\'data/context/' + dataset + '/' + mod[ind][2].replace(/'/g,'\\\'') + '\')';
		else sourceLink = '#';
		targetString = mod[ind][3];
		if (['','#'].indexOf(mod[ind][4].trim()) <= -1) targetLink = 'javascript:window.open(\'data/context/' + dataset + '/' + mod[ind][4].replace(/'/g,'\\\'') + '\')';
		else targetLink = '#';
		corpusParaphraseJudge = mod[ind][5];

		if (users.length == 1) {
			userParaphraseJudge = mod[ind][6];
			sureAlignments = mod[ind][7];
			possAlignments = mod[ind][8];
			comments = mod[ind][9].trim();
		} else {
			userAParaphraseJudge = mod[ind][6][0];
			userASureAlignments = mod[ind][6][1];
			userAPossAlignments = mod[ind][6][2];
			userAComments = mod[ind][6][3].trim();

			userBParaphraseJudge = mod[ind][7][0];
			userBSureAlignments = mod[ind][7][1];
			userBPossAlignments = mod[ind][7][2];
			userBComments = mod[ind][7][3].trim();

			arbitParaphraseJudge = mod[ind][8][0];
			arbitSureAlignments = mod[ind][8][1];
			arbitPossAlignments = mod[ind][8][2];
			arbitComments = mod[ind][8][3].trim();
		}

		Load();
		Draw();
	}
}

function LoadFromBase() {
	if (typeof ind !== 'undefined') {
		pairID = base[ind][0];
		sourceString = base[ind][1];
		if (['','#'].indexOf(base[ind][2].trim()) <= -1) sourceLink = 'javascript:window.open(\'data/context/' + dataset + '/' + base[ind][2].replace(/'/g,'\\\'') + '\')';
		else sourceLink = '#';
		targetString = base[ind][3];
		if (['','#'].indexOf(base[ind][4].trim()) <= -1) targetLink = 'javascript:window.open(\'data/context/' + dataset + '/' + base[ind][4].replace(/'/g,'\\\'') + '\')';
		else targetLink = '#';
		corpusParaphraseJudge = base[ind][5];

		if (users.length == 1) {
			userParaphraseJudge = base[ind][6];
			sureAlignments = base[ind][7];
			possAlignments = base[ind][8];
			comments = base[ind][9].trim();
		} else {
			userAParaphraseJudge = base[ind][6][0];
			userASureAlignments = base[ind][6][1];
			userAPossAlignments = base[ind][6][2];
			userAComments = base[ind][6][3].trim();

			userBParaphraseJudge = base[ind][7][0];
			userBSureAlignments = base[ind][7][1];
			userBPossAlignments = base[ind][7][2];
			userBComments = base[ind][7][3].trim();

			arbitParaphraseJudge = base[ind][8][0];
			arbitSureAlignments = base[ind][8][1];
			arbitPossAlignments = base[ind][8][2];
			arbitComments = base[ind][8][3].trim();
		}

		Load();
		Draw();
	}
}

function SaveProgress() {
	UpdateBase();
	UpdateMod();
	var allCrap = [];
	for (i in mod)
		if (users.length == 1) allCrap.push(mod[i].join('\t'));
		else {
			var thisrowout = [];
			for (var j = 0; j < 6; j++) thisrowout.push(mod[i][j]);
			for (j in mod[i][8]) thisrowout.push(mod[i][8][j]);
			allCrap.push(thisrowout.join('\t'));
		}
	socket.emit('SaveProgress', [users, dataset, batches[workingBatchInd], allCrap.join('\n')]);
	ReadBatchStructure();
	writeDatasetNavigation();
}

function SaveClose() {
	SaveProgress();
	CleanSlate();
}

function Submit() {
	UpdateBase();
	UpdateMod();
	var allCrap = [];
	for (i in mod)
		if (users.length == 1) allCrap.push(mod[i].join('\t'));
		else {
			var thisrowout = [];
			for (var j = 0; j < 6; j++) thisrowout.push(mod[i][j]);
			for (j in mod[i][8]) thisrowout.push(mod[i][8][j]);
			allCrap.push(thisrowout.join('\t'));
		}
	socket.emit('SaveProgress', [users, dataset, batches[workingBatchInd], allCrap.join('\n')]);
	socket.emit('Submit', [users, dataset, batches[workingBatchInd], allCrap.join('\n')]);
	CleanSlate();
	ReadBatchStructure();
	writeDatasetNavigation();
}

// right now it skips complete if in edit mode
function Proceed(orgInd, tmpInd, tmpEdt) {
	var FoundAnotherBatch = false;
	while (availableBatches.length > 0 && tmpInd != orgInd && tmpInd >= 0 && tmpInd < batches.length) {
		if (availableBatches.indexOf(tmpInd) >= 0) {
			if (users.length == 1 || (users.length != 1 && completion[tmpInd][2] == 1 && completion[tmpInd][3] == 1)) {
				var tmpCmp = 0;
				if (completion[tmpInd][1] == 1) tmpCmp = 2;
				else if (completion[tmpInd][0] == 1) tmpCmp = 1;
				if (Val('editable') == false || tmpCmp != 2) {
					SelectBatch(tmpInd,tmpCmp,tmpEdt);
					FoundAnotherBatch = true;
					break;
				} else tmpInd = (tmpInd+1 >= batches.length) ? 0 : tmpInd+1;
			} else tmpInd = (tmpInd+1 >= batches.length) ? 0 : tmpInd+1;
		} else tmpInd = (tmpInd+1 >= batches.length) ? 0 : tmpInd+1;
	}
	if (FoundAnotherBatch == false) MakeVisible('Dataset');
}

function DiscardAndProceed() {
	var orgInd = workingBatchInd;
	var tmpInd = (orgInd+1 >= batches.length) ? 0 : orgInd+1;
	var tmpEdt = Val('editable');
	CleanSlate();
	Proceed(orgInd,tmpInd,tmpEdt);
}

function SaveAndProceed() {
	var orgInd = workingBatchInd;
	var tmpInd = (orgInd+1 >= batches.length) ? 0 : orgInd+1;
	var tmpEdt = Val('editable');
	SaveClose();
	Proceed(orgInd,tmpInd,tmpEdt);
}

function SubmitAndProceed() {
	var orgInd = workingBatchInd;
	var tmpInd = (orgInd+1 >= batches.length) ? 0 : orgInd+1;
	var tmpEdt = Val('editable');
	Submit();
	Proceed(orgInd,tmpInd,tmpEdt);
}

function RequestWhich(userselect, datasetselect) {
	var val = true;
	if (typeof userselect !== 'undefined' && userselect != []) {
		userselect = userselect.sort();
		if (typeof datasetselect == 'undefined' || datasetselect == '' || datasetlist.indexOf(datasetselect) <= -1) val = false;
		for (i in userselect) {
			for (j in userselect) 
				if (i != j && userselect[i] == userselect[j]) {
					val = false;
					break;
				}
			if (userlist[i] == '' || userlist.indexOf(userselect[i]) <= -1) {
				val = false;
				break;
			}
		}
		if (userselect.join('&') == users.join('&') && datasetselect == dataset) val = false;
	} else val = false;
	if (val == true) {
		if (typeof batches !== 'undefined') CleanSlate(); // SaveClose();
		users = userselect;
		dataset = datasetselect;
		$('#dataset_navigation').empty();
		$('#dataset_navigation').append('<h3><i>The batches haven\'t loaded yet. If they don\'t appear shortly, there may be an issue with the file structure.</i></h3>');
		writeUserDisplay();
		writeIntroText();
		DatasetIndex = 0;
		ProgressIndex = 0;
		//socket.emit('RequestNewUsersAndSet', [users, dataset]);
		ReadBatchStructure();
		$('#mDataset').show();
		MakeVisible('Dataset');
	}
}

function MakeVisible(page){
	if ('Home' != page) $('#Home').hide();
	if ('Guide' != page) $('#Guide').hide();
	if ('Dataset' != page) $('#Dataset').hide();
	if ('Batch' != page) $('#Batch').hide();
	if ('Workspace' != page) $('#Workspace').hide();
	if ('Settings' != page) $('#Settings').hide();

	var pg = '#'+page;//.toLowerCase();
	$(pg).show();
	// for now who cares about the location hash tbh
	//location.hash = page.toLowerCase();

	//window.scrollTo(0,0);

	$('ul.nav a').parent().removeClass('active');
	$('ul.nav a').filter(function() {
		return this.id == 'm'+page;
	}).parent().addClass('active');
}

/********** BOOL TOOLS **********/

function Set(BoolName,NewVal) {
	bools[BoolName][0] = NewVal;
	WriteSettingsPage();
}

function Val(BoolName) {
	return bools[BoolName][0];
}

function Toggle(BoolName) {
	Set(BoolName,!Val(BoolName));
}

/********** EVENT HANDLING **********/

$(document).ready(function () {
	MakeVisible('Home');
	workingBatchInd = -1;

	// [InitialValue, TitleForSettingsPage, MutableOnSettingsPage]
	bools =	{
		'autosave':[true,'Automatically save when switching between pairs (in editing mode only)',true],
		'editable':[true,'View batches in editing or read-only mode',false],
		'showarbit':[true,'When in arbitration mode, show the arbiter\'s selections',false]
	}

	//TODO: make vars dict? workingBatchInd, Increments, Indices, ind...
	// any global var that isn't a boolean

	//$('#mHome').hide();
	//$('#mGuide').hide();
	$('#mDataset').hide();
	$('#mBatch').hide();
	$('#mWorkspace').hide();

	DatasetIncrement = ($('#navbutton').is(':visible')) ? 5 : 10;
	DatasetIndex = 0;
	ProgressIncrement = ($('#navbutton').is(':visible')) ? 5 : 10;
	ProgressIndex = 0;
	//lookfor = 'unfiltered';

	WriteSettingsPage();

	var cUrl = document.URL;
	socket = io.connect(cUrl);
	socket.emit('BrowserAgent', { browser: navigator.userAgent });
	socket.emit('RequestAllUsersAndSets');

	socket.on('GetAllUsersAndSets', function (data) {
		//tasklist = ['annotate','arbitrate','add user'];
		tasklist = ['annotate','arbitrate'];
		//userlist = data[0].concat(['ajda&johnsey']);
		userlist = data[0];
		datasetlist = data[1]

		task = '';
		users = [];
		dataset = '';

		writeSelectionWidgets();
		writeUserDisplay();
		//writeIntroText();
		//ReadBatchStructure();
	});

	socket.on('ShowBatchStructure', function (data) {
		batches = data[0];
		completion = data[1];
		availableBatches = [];
		for (i in batches)
			if (users.length == 1 || (users.length != 1 && completion[i][2] == 1 && completion[i][3] == 1))
				availableBatches.push(parseInt(i));
		//DatasetIndex = 0;
		ProgressIndex = 0;
		writeDatasetNavigation();
	});

	socket.on('ShowWorkingBatch', function (data) {
		if (users.length == 1) {
			var allpoints = data.split('\n');
			ind = 0;
			base = []
			for (i in allpoints)
				if (allpoints[i])
					base.push(allpoints[i].split('\t'));
		} else {
			var quad = data;
			for (i in quad) quad[i] = quad[i].split('\n');
			var batchlen = quad[0].length-1;
			ind = 0;
			base = [];
			for (var i = 0; i < batchlen; i++) {
				var thisgrid = quad[0][i].split('\t').slice(0,6);
				for (var j = 1; j < 4; j++) {
					var fromthisuser = [];
					if (!quad[j][i] || 0 === quad[j][i].length) {
						fromthisuser.push(thisgrid[5]);
						if (j == 3) {
							fromthisuser.push(getAlignOverlap(thisgrid[6][1], thisgrid[7][1]));
							fromthisuser.push(getAlignOverlap(thisgrid[6][2], thisgrid[7][2]));
						} else {
							fromthisuser.push('');
							fromthisuser.push('');
						}
						fromthisuser.push('');
					} else fromthisuser = quad[j][i].split('\t').slice(6,10);
					thisgrid.push(fromthisuser);
				}
				base.push(thisgrid);
			}
		}
		mod = $.extend(true, [], base);
		writeBatchNavigation();
		LoadFromBase();
	});

});

/*$(document).click(function (event) {
	var clickover = $(event.target);
	var _opened = $(".navbar-collapse").hasClass("in");
	if (_opened === true && !clickover.hasClass("navbar-toggle")) {
		$('.navbar-collapse').collapse('hide');
	}
});*/

$(document).on('click', function(e) {
//	if (!$(event.target).hasClass("navbar-fixed-top"))
	if ($('#navbutton').is(':visible') && $('#navbar').is(':visible'))
		$('#navbar').collapse('hide');
	if ($('#userbutton').is(':visible') && $('#userbar').is(':visible'))
		$('#userbar').collapse('hide');
//	if (!$(event.target).hasClass('menu-btn'))
//		$('.rc-menu').hide();
});
$(document).on('mousemove', function(e) {
//$(window).on('mousemove', function(e) {
	PosX = e.pageX - $(window).scrollLeft();
	PosY = e.pageY - $(window).scrollTop();
});

/* disable right click and allow menu instead */
// fix the weirdness with forced scrolling eventually, for now who cares
$(document).on('contextmenu', function() {
	$('.navbar .nav li a').each(function () {
		//if ($(this).parent().hasClass('active') && ['mBatch','mWorkspace'].indexOf($(this).attr('id')) >= 0)
		if ($(this).parent().hasClass('active') && $(this).attr('id') == 'mBatch')
			$('.menu-btn.Batch').click();
			//OpenMenu('Batch');
		if ($(this).parent().hasClass('active') && $(this).attr('id') == 'mWorkspace')
			$('.menu-btn.Workspace').click();
			//OpenMenu('Workspace');
	});
	return false;
});
$(document).on('click', '.menu-btn.Batch', function(e) {
	if (typeof(PosX) !== undefined && typeof(PosY) !== undefined) {
		var NewX = Math.max(0,Math.min(PosX-$('.rc-menu.Batch').width()/2, $(window).width()-$('.rc-menu.Batch').width()-2));
		var NewY = Math.max(50,Math.min(PosY, $(window).height()-$('.rc-menu.Batch')[0].scrollHeight-4));
		$('.rc-menu.Batch').css({ 'top': NewY, 'left': NewX });
	}
});
$(document).on('click', '.menu-btn.Workspace', function(e) {
	if (typeof(PosX) !== undefined && typeof(PosY) !== undefined) {
		var NewX = Math.max(0,Math.min(PosX-$('.rc-menu.Workspace').width()/2, $(window).width()-$('.rc-menu.Workspace').width()-2));
		var NewY = Math.max(50,Math.min(PosY, $(window).height()-$('.rc-menu.Workspace')[0].scrollHeight-4));
		$('.rc-menu.Workspace').css({ 'top': NewY, 'left': NewX });
	}
});
/*function OpenMenu(page) {
	if (typeof(PosX) !== undefined && typeof(PosY) !== undefined) {
		var NewX = Math.max(0,Math.min(PosX-$('.rc-menu.'+page).width()/2, $(document).width()-$('.rc-menu.'+page).width()-2));
		var NewY = Math.max(50,Math.min(PosY, $(document).height()-$('.rc-menu.'+page)[0].scrollHeight-4));
		$('.rc-menu.'+page).css({ 'top': NewY, 'left': NewX });
		$('.rc-menu.'+page).toggle();
	}
}*/

/* prevent image and link drag */
$(document).on('dragstart', 'img', function(event) {
	event.preventDefault();
});
$(document).on('drag', 'img', function(event) {
	event.preventDefault();
});
$(document).on('dragstart', 'a', function(event) {
	event.preventDefault();
});
$(document).on('drag', 'a', function(event) {
	event.preventDefault();
});

//$(window).resize(function() {
//	if (typeof ind !== 'undefined') Draw();
//});

$(document).on('click', '.btn-group-select .btn', function() {
	if (!$(this).hasClass('disabled')) {
		$(this).parent().children().removeClass('btn-primary');
		$(this).parent().children().addClass('btn-default');
		$(this).removeClass('btn-default');
		$(this).addClass('btn-primary');
	}
});

$(document).on('click', '.nav li > a', function() {
	if ($(this).parent().hasClass('disabled') == false) {
	 	$('.nav li').removeClass('active');
		$(this).parent().addClass('active');
	}
});

//??
$(document).on('click', '.dropdown-menu li a', function() {
	$(this).parents('.dropdown').find('.btn').html($(this).text() + ' <span class="caret"></span>');
	$(this).parents('.dropdown').find('.btn').val($(this).data('value'));
	//console.log($(this).parents(".dropdown").find('.btn').val($(this).data('value')));
	//console.log('AAAHHH');
});

///// Textarea events handler:
//$(document).on('click', '#comment_box' , function() {
//   	console.log("Comments: " + comments);
//});

