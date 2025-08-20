#!/usr/bin/env python3
"""
Check noVNC directory structure
"""
import os
import sys

def check_novnc_structure():
    """Check noVNC directory structure"""
    print("=== noVNC Directory Structure Check ===")
    
    # Check if noVNC directory exists
    novnc_dir = "noVNC"
    if not os.path.exists(novnc_dir):
        print(f"❌ noVNC directory not found: {novnc_dir}")
        return False
    
    print(f"✅ noVNC directory found: {novnc_dir}")
    
    # List all files and directories in noVNC
    print(f"\nContents of {novnc_dir}/:")
    try:
        for item in os.listdir(novnc_dir):
            item_path = os.path.join(novnc_dir, item)
            if os.path.isdir(item_path):
                print(f"📁 {item}/")
            else:
                print(f"📄 {item}")
    except Exception as e:
        print(f"❌ Error listing directory: {e}")
        return False
    
    # Check for vnc.html
    vnc_html_path = os.path.join(novnc_dir, "vnc.html")
    if os.path.exists(vnc_html_path):
        print(f"\n✅ vnc.html found: {vnc_html_path}")
    else:
        print(f"\n❌ vnc.html not found: {vnc_html_path}")
    
    # Check for core directory
    core_dir = os.path.join(novnc_dir, "core")
    if os.path.exists(core_dir):
        print(f"\n✅ Core directory found: {core_dir}")
        print(f"Contents of {core_dir}/:")
        try:
            for item in os.listdir(core_dir):
                item_path = os.path.join(core_dir, item)
                if os.path.isdir(item_path):
                    print(f"  📁 {item}/")
                else:
                    print(f"  📄 {item}")
        except Exception as e:
            print(f"❌ Error listing core directory: {e}")
    else:
        print(f"\n❌ Core directory not found: {core_dir}")
    
    # Check for utils directory
    utils_dir = os.path.join(novnc_dir, "utils")
    if os.path.exists(utils_dir):
        print(f"\n✅ Utils directory found: {utils_dir}")
    else:
        print(f"\n❌ Utils directory not found: {utils_dir}")
    
    # Find vnc.html in subdirectories
    print(f"\n🔍 Searching for vnc.html in subdirectories...")
    found_vnc_html = []
    for root, dirs, files in os.walk(novnc_dir):
        if "vnc.html" in files:
            vnc_path = os.path.join(root, "vnc.html")
            found_vnc_html.append(vnc_path)
            print(f"✅ Found vnc.html: {vnc_path}")
    
    if not found_vnc_html:
        print("❌ No vnc.html found in any subdirectory")
    
    return True

if __name__ == "__main__":
    success = check_novnc_structure()
    if success:
        print("\n🎉 Directory check completed!")
    else:
        print("\n❌ Directory check failed!")
        sys.exit(1)
