import os

def create_prompt_file(project_folder, output_file):
    with open(output_file, 'w') as outfile:
        for root, dirs, files in os.walk(project_folder):
            for file in files:
                file_path = os.path.join(root, file)
                outfile.write(f"--- File: {file_path} ---\n")
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        outfile.write(content + "\n\n")
                except Exception as e:
                    outfile.write(f"Error reading {file_path}: {e}\n\n")

if __name__ == "__main__":
    project_folder = input("Enter the project folder path: ")
    output_file = os.path.join(project_folder, "combined_prompts.txt")
    create_prompt_file(project_folder, output_file)
    print(f"Prompt file created at: {output_file}")