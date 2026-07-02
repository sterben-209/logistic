import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add "Add Row" button
sync_btn_pattern = r'<button class="flex items-center gap-2 px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded transition-colors text-sm font-label-sm">\s*<span class="material-symbols-outlined text-\[16px\]">sync</span>\s*Sync Real-time Data\s*</button>'
add_btn_html = '''<button class="flex items-center gap-2 px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded transition-colors text-sm font-label-sm">
                              <span class="material-symbols-outlined text-[16px]">sync</span>
                              Sync Real-time Data
                          </button>
                          <button id="add-row-btn" class="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-on-primary rounded transition-colors text-sm font-label-sm">
                              <span class="material-symbols-outlined text-[16px]">add</span>
                              Add Row
                          </button>'''
html = re.sub(sync_btn_pattern, add_btn_html, html)

# 2. Add Delete button to all rows
# Existing: <button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
action_pattern = r'<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-\[18px\]">edit</span></button>'
new_actions = '''<button class="text-outline hover:text-primary transition-colors edit-btn" title="Edit"><span class="material-symbols-outlined text-[18px]">edit</span></button>
  <button class="text-outline hover:text-error transition-colors delete-btn ml-2" title="Delete"><span class="material-symbols-outlined text-[18px]">delete</span></button>'''
html = re.sub(action_pattern, new_actions, html)

# 3. Update the JavaScript
# We will replace the entire Table Edit Logic block
old_js_start = '// Table Edit Logic for Operations View'
old_js_end = '</script>\n</body>'
match = re.search(f'{old_js_start}.*?(?={old_js_end})', html, re.DOTALL)

new_js = '''// Table Edit Logic for Operations View
    document.addEventListener('DOMContentLoaded', () => {
        const table = document.querySelector('#view-operations table');
        const tbody = table ? table.querySelector('tbody') : null;
        const addRowBtn = document.getElementById('add-row-btn');
        if(!table || !tbody) return;

        // Delegate click events for edit and delete
        table.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if(!btn) return;
            
            const row = btn.closest('tr');
            if(!row) return;

            // Delete action
            if(btn.classList.contains('delete-btn')) {
                if(confirm('Are you sure you want to delete this container?')) {
                    row.remove();
                    // Re-index rows
                    Array.from(tbody.querySelectorAll('tr')).forEach((r, idx) => {
                        const firstCell = r.querySelector('td');
                        if(firstCell) firstCell.textContent = idx + 1;
                    });
                }
                return;
            }

            // Edit action
            if(btn.classList.contains('edit-btn')) {
                const icon = btn.querySelector('.material-symbols-outlined');
                const isEditing = row.classList.contains('is-editing');
                
                const editableIndices = [1, 2, 3, 4, 5];
                const cells = row.querySelectorAll('td');

                if (!isEditing) {
                    // Enter Edit Mode
                    row.classList.add('is-editing');
                    row.classList.add('bg-primary/5'); 
                    if(icon) icon.textContent = 'save';
                    btn.classList.replace('text-outline', 'text-secondary');
                    btn.classList.replace('hover:text-primary', 'hover:text-secondary-container');

                    editableIndices.forEach(idx => {
                        const cell = cells[idx];
                        if(cell) {
                            cell.setAttribute('contenteditable', 'true');
                            cell.classList.add('outline-none', 'ring-1', 'ring-primary/50', 'bg-surface-container-highest', 'rounded', 'px-1');
                        }
                    });
                    
                    if(cells[1]) cells[1].focus();
                } else {
                    // Save Mode
                    row.classList.remove('is-editing');
                    row.classList.remove('bg-primary/5');
                    if(icon) icon.textContent = 'edit';
                    btn.classList.replace('text-secondary', 'text-outline');
                    btn.classList.replace('hover:text-secondary-container', 'hover:text-primary');

                    editableIndices.forEach(idx => {
                        const cell = cells[idx];
                        if(cell) {
                            cell.setAttribute('contenteditable', 'false');
                            cell.classList.remove('outline-none', 'ring-1', 'ring-primary/50', 'bg-surface-container-highest', 'rounded', 'px-1');
                        }
                    });
                    
                    const statusSpan = cells[6]?.querySelector('span');
                    if(statusSpan) {
                        const oldText = statusSpan.textContent;
                        const oldClasses = statusSpan.className;
                        statusSpan.textContent = 'UPDATED';
                        statusSpan.className = 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary/20 text-secondary border border-secondary/50';
                        setTimeout(() => {
                            statusSpan.textContent = oldText;
                            statusSpan.className = oldClasses;
                        }, 2000);
                    }
                }
            }
        });

        // Add Row action
        if(addRowBtn) {
            addRowBtn.addEventListener('click', () => {
                const newRow = document.createElement('tr');
                newRow.className = 'data-grid-row border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors';
                const rowCount = tbody.querySelectorAll('tr').length + 1;
                
                newRow.innerHTML = 
                  <td class="data-grid-cell text-center text-outline-variant py-3 px-4"></td>
                  <td class="data-grid-cell font-bold text-on-surface py-3 px-4">NEW-CONT</td>
                  <td class="data-grid-cell text-on-surface-variant py-3 px-4">20' Dry</td>
                  <td class="data-grid-cell py-3 px-4">0.0</td>
                  <td class="data-grid-cell text-outline-variant py-3 px-4">A-00</td>
                  <td class="data-grid-cell text-outline-variant py-3 px-4">Y-00</td>
                  <td class="data-grid-cell py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-bright text-on-surface-variant border border-outline-variant/30">PENDING</span>
                  </td>
                  <td class="data-grid-cell text-right py-3 px-4 whitespace-nowrap">
                  <button class="text-outline hover:text-primary transition-colors edit-btn" title="Edit"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                  <button class="text-outline hover:text-error transition-colors delete-btn ml-2" title="Delete"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                  </td>
                ;
                tbody.prepend(newRow); // add to top
                
                // Automatically click edit on new row
                const editBtn = newRow.querySelector('.edit-btn');
                if(editBtn) editBtn.click();
            });
        }
    });
'''

if match:
    html = html[:match.start()] + new_js + html[match.end():]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print("CRUD logic updated successfully.")
else:
    print("Could not find old JS logic to replace.")
