import test from 'node:test';
import assert from 'node:assert/strict';
import {scopeImportedAnchors} from '../src/import.mjs';
test('separate imports use distinct anchors while preserving chapter links',()=>{
 const input=[{html:'<p>각주<a href="#note-1">1</a></p>'},{html:'<p id="note-1">설명</p>'}];
 const first=scopeImportedAnchors(input,'first'),second=scopeImportedAnchors(input,'second');
 assert.match(first[0].html,/href="#first-note-1"/);assert.match(first[1].html,/id="first-note-1"/);
 assert.match(second[1].html,/id="second-note-1"/);assert.match(input[1].html,/id="note-1"/);
});
