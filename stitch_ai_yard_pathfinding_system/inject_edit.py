import os

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

edit_script = '''
    // Table Edit Logic for Operations View
    document.addEventListener('DOMContentLoaded', () => {
        const table = document.querySelector('#view-operations table');
        if(!table) return;

        table.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if(!btn) return;
            
            const icon = btn.querySelector('.material-symbols-outlined');
            if(!icon) return;

            const row = btn.closest('tr');
            if(!row) return;

            const isEditing = row.classList.contains('is-editing');
            
            // Cells that should be editable (skip ID and Status and Actions)
            // Indices: 0:Idx, 1:ContainerID, 2:Type, 3:Weight, 4:X, 5:Y, 6:Status, 7:Action
            const editableIndices = [1, 2, 3, 4, 5];
            const cells = row.querySelectorAll('td');

            if (!isEditing) {
                // Enter Edit Mode
                row.classList.add('is-editing');
                row.classList.add('bg-primary/5'); // Highlight row
                icon.textContent = 'save';
                btn.classList.replace('text-outline', 'text-secondary');
                btn.classList.replace('hover:text-primary', 'hover:text-secondary-container');

                editableIndices.forEach(idx => {
                    const cell = cells[idx];
                    if(cell) {
                        cell.setAttribute('contenteditable', 'true');
                        cell.classList.add('outline-none', 'ring-1', 'ring-primary/50', 'bg-surface-container-highest', 'rounded', 'px-1');
                    }
                });
                
                // Focus first editable cell
                if(cells[1]) cells[1].focus();
            } else {
                // Save Mode
                row.classList.remove('is-editing');
                row.classList.remove('bg-primary/5');
                icon.textContent = 'edit';
                btn.classList.replace('text-secondary', 'text-outline');
                btn.classList.replace('hover:text-secondary-container', 'hover:text-primary');

                editableIndices.forEach(idx => {
                    const cell = cells[idx];
                    if(cell) {
                        cell.setAttribute('contenteditable', 'false');
                        cell.classList.remove('outline-none', 'ring-1', 'ring-primary/50', 'bg-surface-container-highest', 'rounded', 'px-1');
                    }
                });
                
                // Optional: Show a quick toast or visual feedback
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
        });
    });
'''

# Inject script before the closing </script> of the main spa logic
if "Table Edit Logic for Operations View" not in html:
    html = html.replace('</script>\n</body>', f'{edit_script}\n</script>\n</body>')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Injected table edit script")
else:
    print("Script already present")
