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
} from './constants.js';


const origin_date = new Date();
const today = new Date(origin_date.getFullYear(), origin_date.getMonth(), origin_date.getDate() +1, 0, 1);
const tomorrow = new Date(origin_date.getFullYear(), origin_date.getMonth(), origin_date.getDate()+2 , 0, 1);

window.addEventListener('load', main, false);

function main(e) {
  const jsInitCheckTimer = setInterval(jsLoaded, jsInitCheckMilliSecond);
  async function jsLoaded() {
    if (document.getElementsByClassName('module-container') != null) {
      // CLEの先頭ページの新着情報、サポートセンターなどの欄
      const body = document.getElementsByClassName('module-section');
      makeAssignmentList(body[0]);
      makeClassList(body[0]);
      clearInterval(jsInitCheckTimer);
      }
    addAssignmentListButton();
  }
}

async function makeClassList(target) {
  const res = await fetch(classListApiUrl, { method: 'GET', mode: 'cors' });
  const data = await res.json();

  console.log(JSON.stringify(data, null, 2));

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
    date: origin_date.toJSON(),
    date_compare: dateCompareText.GREATER_OR_EQUAL,
    includeCount: true,
    limit: calendarDataLimit,
    offset: 0,
  };
  const query = new URLSearchParams(params);
  const requestUrl = `${url}?` + query;
  const res = await fetch(requestUrl, { method: 'GET', mode: 'cors' });
  const data = await res.json();

  console.log(JSON.stringify(data, null, 2));

  const results = data['results'];
  // console.log(JSON.stringify(data, null, 2));

  // 一番上（新着情報）に要素を追加
  addTable(results, target);
  const title = document.createElement('h3');
  title.textContent = '課題一覧' + `（取得: ${formatDateForShow(origin_date)}）`;
  target.prepend(title);
}

function addTable(results, body) {
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

  results.forEach((element) => {
    const endDate = new Date(element['endDate']);
    const courseId = element['calendarId'];
    const ItemSourceType = element['itemSourceType'];
    const ItemSourceId = element['itemSourceId'];
    // const className = element['calendarNameLocalizable']['rawValue'].split(':')[1].trim();
    // console.log(JSON.stringify(element, null, 2));

    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const link = document.createElement('a');
    const assignmentUrl = getAssignmentUrl(courseId, ItemSourceType, ItemSourceId);
    link.setAttribute('href', assignmentUrl);
    link.setAttribute('target', '_blank');
    // const titleText = document.createTextNode(element['title']);
    // const classNameText =element['calendarNameLocalizable']['rawValue'].split(':')[1].split('/')[0].trim();
    const cellText = document.createTextNode(element['title'] + '___' + element['calendarNameLocalizable']['rawValue'].split(':')[1].split('/')[0].trim());
    const cell_deadline = document.createElement('td');
    const cell_todo = document.createElement('input');
    cell_todo.type = 'checkbox';
    link.appendChild(cellText);
    cell.appendChild(link);
    cell_deadline.appendChild(document.createTextNode(formatDateForShow(endDate)));
    row.appendChild(cell);
    row.appendChild(cell_deadline);
    row.appendChild(cell_todo);
    ///
    console.log('endDate:', endDate);
    console.log('today:', today);
    console.log('tomorrow',tomorrow)
    console.log('origin_date:', origin_date);
    ///
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
  });
  table.forEach((t) => div.appendChild(t));
  body.prepend(div);
}

function getHeader() {
  const header = document.createElement('tr');
  const header_cell1 = document.createElement('th');
  header_cell1.appendChild(document.createTextNode('課題'));
  const header_cell2 = document.createElement('th');
  header_cell2.appendChild(document.createTextNode('締切'));
  const header_cell3 = document.createElement('th');
  header_cell3.appendChild(document.createTextNode('完了'));
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

function addAssignmentListButton() {
  const baseToolsList = document.getElementById('base_tools');
  if (baseToolsList) {
    console.log('base_tools.off_canvas_list found');
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
  const assignmentListPopup = document.createElement('div');
  assignmentListPopup.style.position = 'fixed';
  assignmentListPopup.style.top = '50%';
  assignmentListPopup.style.left = '50%';
  assignmentListPopup.style.transform = 'translate(-50%, -50%)';
  assignmentListPopup.style.backgroundColor = 'white';
  assignmentListPopup.style.padding = '20px';
  assignmentListPopup.style.zIndex = '9999';

  const closeButton = document.createElement('button');
  closeButton.textContent = '閉じる';
  closeButton.style.marginBottom = '10px';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(assignmentListPopup);
  });

  assignmentListPopup.appendChild(closeButton);

  const assignmentTable = document.createElement('div');
  assignmentListPopup.appendChild(assignmentTable);

  document.body.appendChild(assignmentListPopup);
}