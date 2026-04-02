#!/usr/bin/env python3
"""
创建 Google Sheets 工作表
用于 William 学习规划系统同步
"""

import json
import subprocess
import sys

SPREADSHEET_ID = "GOOGLE_SHEETS_ID_PLACEHOLDER"
SHEETS_TO_CREATE = ["规划表", "待办事项", "便签"]

def run_gog(args):
    """执行 gog 命令"""
    cmd = ["gog"] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout, result.stderr, result.returncode

def get_existing_sheets():
    """获取现有的工作表列表"""
    # 尝试读取已知的工作表
    existing = []
    # 读取第一个单元格来获取默认工作表名称
    stdout, stderr, code = run_gog(["sheets", "get", SPREADSHEET_ID, "A1", "--json"])
    if code == 0 and stdout:
        try:
            data = json.loads(stdout)
            if "range" in data:
                # 提取工作表名称
                sheet_name = data["range"].split("!")[0].strip("'")
                existing.append(sheet_name)
        except:
            pass
    return existing

def create_sheet_with_data(sheet_name, headers):
    """通过写入数据创建工作表（gog 会自动创建不存在的表）"""
    print(f"正在创建工作表: {sheet_name}")
    
    # 准备数据
    data = [headers]
    data_json = json.dumps(data, ensure_ascii=False)
    
    # 写入数据
    cmd = [
        "gog", "sheets", "update",
        SPREADSHEET_ID,
        f"{sheet_name}!A1",
        "--values-json", data_json,
        "--input", "USER_ENTERED"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ 工作表 '{sheet_name}' 创建成功")
        return True
    else:
        print(f"❌ 工作表 '{sheet_name}' 创建失败: {result.stderr}")
        return False

def main():
    print("📝 William 学习规划 - Google Sheets 工作表创建工具")
    print("=" * 50)
    print(f"Spreadsheet ID: {SPREADSHEET_ID}")
    print()
    
    # 定义各工作表的表头
    sheets_config = {
        "规划表": ["ID", "标题", "类型", "学科", "开始日期", "结束日期", "状态", "优先级", "进度", "负责人", "目标分数", "实际分数", "地点", "老师", "费用", "标签", "描述", "创建时间"],
        "待办事项": ["ID", "标题", "截止日期", "截止时间", "状态", "优先级", "负责人", "关联规划", "重复", "提醒(分钟)", "描述", "完成时间", "创建时间"],
        "便签": ["ID", "标题", "内容", "颜色", "创建时间"]
    }
    
    success_count = 0
    for sheet_name, headers in sheets_config.items():
        if create_sheet_with_data(sheet_name, headers):
            success_count += 1
        print()
    
    print("=" * 50)
    print(f"完成: {success_count}/{len(sheets_config)} 个工作表创建成功")
    
    if success_count == len(sheets_config):
        print("✅ 所有必要的工作表已就绪，可以进行同步了！")
        return 0
    else:
        print("⚠️ 部分工作表创建失败，请检查 Google Sheets 权限")
        return 1

if __name__ == "__main__":
    sys.exit(main())