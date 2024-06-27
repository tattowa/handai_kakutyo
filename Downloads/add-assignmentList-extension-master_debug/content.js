import {
  assignmentDeadline,
  calendarDataLimit,
  classListApiUrl,
  dateCompareText,
  formatDateForShow,
  getAssignmentUrl,
  getClassUrl,
  jsInitCheckMilliSecond,
  semester,
  url,
  yearOfClassId,
  getColumnRequestUrl,
  getAssignmentStatusUrl,
  getProgresstUrl,
  getReviewtUrl,
} from './constants.js';


const origin_date = new Date();
const today = new Date(origin_date.getFullYear(), origin_date.getMonth(), origin_date.getDate() +1, 0, 1);
const tomorrow = new Date(origin_date.getFullYear(), origin_date.getMonth(), origin_date.getDate()+2 , 0, 1);
const start_date = new Date(origin_date.getFullYear(), origin_date.getMonth(), origin_date.getDate() -1, 0, 1);

window.addEventListener('load', main, false);

function main(e) {
  const jsInitCheckTimer = setInterval(jsLoaded, jsInitCheckMilliSecond);
  let buttonAdded = false;

  async function jsLoaded() {
    if (!buttonAdded) {
      try {
        await addAssignmentListButton();
        buttonAdded = true;
        setTimeout(() => {
          clearInterval(jsInitCheckTimer);
          }, jsInitCheckMilliSecond);
        } catch (error) {
          console.error('Error adding assignment list button:', error);
        }
    }
  }
}

async function makeClassList(target) {
  const res = await fetch(classListApiUrl, { method: 'GET', mode: 'cors' });
  const data = await res.json();

  // console.log(JSON.stringify(data, null, 2));

  const results = data['results'];
  let classList = [];
  results.forEach((data) => {
    const name = data['name'];
    // 2022-xxxxxxxxxx-Aか2022-xxxxxxxxx-Bなど、講義名の先頭の文字列を読み取る
    const classId = name.substr(0, name.indexOf(':'));
    const className = name.substring(name.indexOf(':') + 1, name.indexOf('/')).trim();
    // classidの先頭の年号を読み取る
    const headerOfClassId = classId.substr(0, classId.indexOf('-'));
    if (headerOfClassId) {
      // 先頭の年号が2022かどうか
      if (headerOfClassId == yearOfClassId) {
        // classIdの末尾がAかBか
        // if (classId.slice(-1) == semester.EARLY) {
          classList.push({ name: className, id: data['id'] });
        // }
      }
    }
  });
  getClassListTable(classList, target);
  const title = document.createElement('h3');
  title.textContent = '授業一覧';
  target.prepend(title);
}

function getClassListTable(data, target) {
  const div = document.createElement('div');
  const table = document.createElement('table');
  table.setAttribute('border', 2);
  table.setAttribute('style', 'table-layout: fixed;width: 80%;');
  const header = document.createElement('tr');
  const header_cell = document.createElement('th');
  header_cell.appendChild(document.createTextNode('授業一覧'));
  header.appendChild(header_cell);
  table.appendChild(header);
  data.forEach((elem) => {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const link = document.createElement('a');
    const classUrl = getClassUrl(elem['id']);
    link.setAttribute('href', classUrl);
    link.setAttribute('target', '_blank');
    const cellText = document.createTextNode(elem['name']);
    link.appendChild(cellText);
    cell.appendChild(link);
    row.appendChild(cell);
    table.appendChild(row);
  });
  div.appendChild(table);
  target.prepend(div);
}

async function makeAssignmentList(target) {
  // date_compateは"lessOrEqual"か"greaterOrEqual"
  const params = {
    date: start_date.toJSON(),
    date_compare: dateCompareText.GREATER_OR_EQUAL,
    includeCount: true,
    limit: calendarDataLimit,
    offset: 0,
  };
  const query = new URLSearchParams(params);
  const requestUrl = `${url}?` + query;
  const res = await fetch(requestUrl, { method: 'GET', mode: 'cors' });
  const data = await res.json();

  // 一番上（新着情報）に要素を追加
  
  const title = document.createElement('h3');
  title.textContent = '課題一覧' + `（取得: ${formatDateForShow(origin_date)}）`;
  target.prepend(title);
  
  await addTable(data['results'], target);

  return data['results'].map(assignment => ({
    id: assignment.id, // または適切な一意の識別子
    element: document.getElementById(assignment.id) // 課題要素のID属性を適切に設定する必要があります
  }));
}

async function addTable(results, body) {
  const div = document.createElement('div');
  div.setAttribute('class', 'module-section');
  let table = [];
  const header = getHeader();
  const labels = ['今日', '明日', '将来', '期限切れ'];
  for (let i = 0; i < 4; i++) {
    table[i] = document.createElement('table');
    table[i].setAttribute('border', 2);
    table[i].setAttribute('style', 'table-layout: fixed;width: 80%;');
    if (i == assignmentDeadline.TODAY) {
      table[assignmentDeadline.TODAY].appendChild(header);
    }
    table[i].appendChild(getDateLabel(labels[i]));
  }

  const previousAssignments = getPreviousAssignments();
  const currentAssignments = [];

  for (const element of results) {
    const endDate = new Date(element['endDate']);
    const courseId = element['calendarId'];
    const itemSourceId = element['itemSourceId'];
    const columnId = await getColumnUrl(courseId, itemSourceId)

    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const link = document.createElement('a');
    const assignmentUrl = getAssignmentUrl(courseId, columnId);
    link.setAttribute('href', assignmentUrl);
    link.setAttribute('target', '_blank');
    // const titleText = document.createTextNode(element['title']);
    // const classNameText =element['calendarNameLocalizable']['rawValue'].split(':')[1].split('/')[0].trim();
    const cellText = document.createTextNode(element['title'] + '___' + element['calendarNameLocalizable']['rawValue'].split(':')[1].split('/')[0].trim());
    const cell_deadline = document.createElement('td');
    const cell_status = document.createElement('td');
    link.appendChild(cellText);
    cell.appendChild(link);
    cell_deadline.appendChild(document.createTextNode(formatDateForShow(endDate)));
    row.appendChild(cell);
    row.appendChild(cell_deadline);
    row.appendChild(cell_status);

    const assignmentId = columnId;
    currentAssignments.push(assignmentId);

    if (!previousAssignments.includes(assignmentId)) {
      addRedDotToAssignment(row);
    }

    const statusData = await getSubmissionStatus(courseId, itemSourceId);
    let statusMessage = "未着手"
    let linkId = "";

    if (!statusData || !statusData.results || statusData.results.length === 0) {
      cell_status.appendChild(document.createTextNode(statusMessage));
    } else {

      for (const result of statusData.results) {
        if (result.status === "NeedsGrading" || result.status === "Completed") {
          statusMessage = "提出済み";
          linkId = result.id;
          const linkElement = document.createElement('a');
          linkElement.href = getReviewtUrl(courseId, columnId, itemSourceId, linkId);
          linkElement.setAttribute('target', '_blank');
          linkElement.appendChild(document.createTextNode(statusMessage));
          cell_status.appendChild(linkElement);
          break;
        } else if (result.status === "InProgress") {
          statusMessage = "着手中";
          linkId = result.id;
          const linkElement = document.createElement('a');
          linkElement.href = getProgresstUrl(courseId, columnId, linkId);
          linkElement.setAttribute('target', '_blank');
          linkElement.appendChild(document.createTextNode(statusMessage));
          cell_status.appendChild(linkElement);
        }
      }
    
    if (statusMessage === "未着手") {
      cell_status.style.backgroundColor = "#c3c3c3";
    } else if (statusMessage === "着手中") {
      cell_status.style.backgroundColor = "#ff9999";
    } else if (statusMessage === "提出済み") {
      cell_status.style.backgroundColor = "#66ff66";
    }
    }


    if (endDate <= origin_date) {
      cell.setAttribute('style', 'color:red;');
      table[assignmentDeadline.EXPIRED].appendChild(row);
    } else if (endDate <= today) {
      table[assignmentDeadline.TODAY].appendChild(row);
    } else if (endDate <= tomorrow) {
      table[assignmentDeadline.TOMORROW].appendChild(row);
    } else if (endDate > tomorrow) {
      table[assignmentDeadline.FUTURE].appendChild(row);
    }
  };
  table.forEach((t) => div.appendChild(t));
  body.appendChild(div);

  savePreviousAssignments(currentAssignments);
}

function getHeader() {
  const header = document.createElement('tr');
  const header_cell1 = document.createElement('th');
  header_cell1.appendChild(document.createTextNode('課題'));
  const header_cell2 = document.createElement('th');
  header_cell2.appendChild(document.createTextNode('締切'));
  const header_cell3 = document.createElement('th');
  header_cell3.appendChild(document.createTextNode('提出状況'));
  header.appendChild(header_cell1);
  header.appendChild(header_cell2);
  header.appendChild(header_cell3);
  return header;
}

function getDateLabel(title) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.setAttribute('style', 'font-weight:bold;');
  cell.setAttribute('colspan', 2);
  const cellText = document.createTextNode(title);
  cell.appendChild(cellText);
  row.appendChild(cell);
  return row;
}

// -----------

// 課題リストボタン実装
function addAssignmentListButton() {
  const baseToolsList = document.getElementById('base_tools');
  if (baseToolsList) {
    // console.log('base_tools.off_canvas_list found');
    const newButton = document.createElement('bb-base-navigation-button');
    const iconUrl = chrome.runtime.getURL("icon.webp");
    newButton.innerHTML = newButton.innerHTML = `
    <div ng-switch="$ctrl.link.type">
      <!-- Static -->
      <!---->
      <li ng-switch-when="static" role="presentation" class="base-navigation-button" ui-sref-active="active" ng-attr-aria-hidden="{{ ($ctrl.previewMode ? 'true' : 'false') }}" aria-hidden="false">
        <a class="base-navigation-button-content themed-background-primary-alt-fill-only theme-border-left-active" ng-click="showAssignmentList()" aria-current="false" tabindex="">
          <ng-switch on="$ctrl.link.id">
            <div ng-switch-default="">
                <span class="icon-wrapper">
                  <img src="${iconUrl}" alt="課題リスト" style="position:absolute; bottom:0.7rem; left: 0.75rem;\
                  width: 35px; height: 35px; filter:invert(1); margin-right:0.3125rem; text-align: center; vertical-align: middle;">
                </span>
              <span class="link-text" bb-translate="">課題リスト</span>
            </div>
          </ng-switch>
        </a>
      </li>
      <!---->
      <!-- Integration -->
      <!---->
    </div>
  `;
    newButton.addEventListener('click', (event) => {
      event.preventDefault();
      showAssignmentList();
    });

    baseToolsList.insertBefore(newButton, baseToolsList.firstChild);
  }
}


function showAssignmentList() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '9998';

  const assignmentListPopup = document.createElement('div');
  assignmentListPopup.style.position = 'fixed';
  assignmentListPopup.style.top = '50%';
  assignmentListPopup.style.left = '50%';
  assignmentListPopup.style.transform = 'translate(-50%, -50%)';
  assignmentListPopup.style.backgroundColor = 'white';
  assignmentListPopup.style.padding = '20px';
  assignmentListPopup.style.zIndex = '9999';
  assignmentListPopup.style.width = '70%'; // 画面の7割の幅
  assignmentListPopup.style.height = '70%'; // 画面の7割の高さ
  assignmentListPopup.style.overflowY = 'auto'; // 縦スクロールを可能にする

  const closeButton = document.createElement('button');
  closeButton.textContent = '閉じる';
  closeButton.style.marginBottom = '10px';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(assignmentListPopup);
    document.body.removeChild(overlay);
  });

  overlay.addEventListener('click', () => {
    document.body.removeChild(assignmentListPopup);
    document.body.removeChild(overlay);
  });

  assignmentListPopup.appendChild(closeButton);

  const assignmentContainer = document.createElement('div');
  assignmentContainer.style.marginBottom = '20px';

  const classContainer = document.createElement('div');

  assignmentListPopup.appendChild(assignmentContainer);
  assignmentListPopup.appendChild(classContainer);

  document.body.appendChild(overlay);
  document.body.appendChild(assignmentListPopup);

  // 課題一覧と授業一覧をポップアップ内に表示
  makeAssignmentList(assignmentContainer)
  makeClassList(classContainer)
}

// course_columnのID取得
async function getColumnUrl(courseId, itemSourceId){
  const res = await fetch(getColumnRequestUrl(courseId, itemSourceId), { method: 'GET', mode: 'cors' });
  const data = await res.json();

  const columnUrl = data.contentId;
  return columnUrl
}


function getPreviousAssignments() {
  const savedAssignments = localStorage.getItem('previousAssignments');
  return savedAssignments ? JSON.parse(savedAssignments) : [];
}

function savePreviousAssignments(assignments) {
  localStorage.setItem('previousAssignments', JSON.stringify(assignments));
}

function addRedDotToAssignment(row) {
  const firstCell = row.querySelector('td');
  if (firstCell) {
    const redDot = document.createElement('span');
    redDot.className = 'new-assignment-marker';
    redDot.style.cssText = 'display: inline-block; width: 10px; height: 10px; background-color: red; border-radius: 50%; margin-right: 5px;';
    firstCell.insertBefore(redDot, firstCell.firstChild);
  }
}

// 提出状況

async function getSubmissionStatus(courseId, itemSourceId) {
  const res = await fetch(getAssignmentStatusUrl(courseId, itemSourceId), { method: 'GET', mode: 'cors' });
  const data = await res.json();
  return data
}
