/**
    Copyright (C) 2023 alampy

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/

// ==UserScript==
// @name         南京邮电大学(NJUPT) 查询平时分
// @id           njupt_detailed_grades
// @namespace    https://alampy.com/
// @version      0.3.1
// @description  南京邮电大学(NJUPT) 查询平时分
// @author       alampy
// @license      AGPL-3.0-or-later
// @match        http://jwxt.njupt.edu.cn/xscj_gc.aspx*
// @match        *://vpn.njupt.edu.cn:8443/http/webvpn5e607416b84322620fcfebad55f2c381efb3e3d8de97685feb46fd2e866a8ae9/xscj_gc.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=i.njupt.edu.cn
// @grant        GM_registerMenuCommand
// @require      https://unpkg.com/sweetalert/dist/sweetalert.min.js
// ==/UserScript==

(function () {
    'use strict';
    function parseTag(tagString) {
        let tag = '';
        let values = [];
        let stack = [];
        let isEscaped = false;

        for (let char of tagString) {
            if (isEscaped) {
                tag += char;
                isEscaped = false;
            } else if (char === '\\') {
                isEscaped = true;
            } else if (char === '<') {
                stack.push({ tag: tag, length: values.length });
                tag = '';
            } else if (char === '>') {
                let { tag: element, length: index } = stack.pop();
                values = values.slice(0, index).concat([{ [element]: values.slice(index) }]);
            } else if (char === ';') {
                values.push(tag);
                tag = '';
            } else {
                tag += char;
            }
        }

        if (tag !== '') {
            values.push(tag);
        }

        return values[0];
    }

    function displaySubjectInfo(inputArray) {
        const academicYear = inputArray[0];
        const semester = inputArray[1];
        const courseCode = inputArray[2];
        const courseName = inputArray[3];
        const gradePoint = inputArray[8];
        const dailyScore = inputArray[9];
        const finalScore = inputArray[11];
        const overallScore = inputArray[13];

        const row = document.createElement('tr');
        const cells = [
            academicYear + '-' + semester + '-' + courseCode,
            courseName,
            '绩点: ' + gradePoint,
            '成绩: ' + overallScore + '（平时' + dailyScore + '+期末' + finalScore + '）'
        ];

        for (let cellText of cells) {
            const cell = document.createElement('td');
            cell.textContent = cellText;
            row.appendChild(cell);
        }

        return row;
    }

    function base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; ++i) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes.buffer;
    }

    function displayAllSubjectInfo(stateBase64) {
        const stateBin = base64ToArrayBuffer(stateBase64);
        const stateStr = new TextDecoder('utf-8').decode(stateBin.slice(0, -20));
        const state = parseTag(stateStr);

        const mainSubjects = state.t[1].t[4].l[0].t[3].l[26].t[4].l[0].t[3].l;
        const table = document.createElement('table');
        for (let mainSubject of mainSubjects) {
            if (typeof mainSubject !== 'object') {
                continue;
            }
            const subjectInfo = mainSubject.t[3].l.filter((x) => typeof x === 'object').map((x) => x.t[0].p[0].p[2].l[0].replace('&nbsp;', 'NA').trim());
            const row = displaySubjectInfo(subjectInfo);
            table.appendChild(row);
        }
        return table;
    }

    const menu_command_id = GM_registerMenuCommand("读取平时分数据", e => {
        try {
            const elem = displayAllSubjectInfo(document.querySelector("[name='__VIEWSTATE']").value);
            swal({ content: elem });
        } catch (e) {
            swal(`出现错误：${e}`);
        }
    }, "");
})();
