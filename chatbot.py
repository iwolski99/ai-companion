import tkinter as tk
from tkinter import ttk, scrolledtext
import google.generativeai as genai
from tkinter import messagebox, filedialog
import json
import os
from datetime import datetime
from ctypes import windll, byref, c_int, sizeof
from PIL import Image, ImageTk
import shutil

class ChatbotGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("AI Girlfriend")
        self.root.geometry("1280x720")
        
        # Enable dark title bar
        try:
            DWMWA_USE_IMMERSIVE_DARK_MODE = 20
            set_window_attribute = windll.dwmapi.DwmSetWindowAttribute
            get_parent = windll.user32.GetParent
            hwnd = get_parent(self.root.winfo_id())
            rendering_policy = DWMWA_USE_IMMERSIVE_DARK_MODE
            value = c_int(2)
            set_window_attribute(hwnd, rendering_policy, byref(value), sizeof(c_int))
        except Exception as e:
            print(f"Failed to set dark title bar: {e}")
        
        # Initialize chat history
        self.chat_history = []
        self.load_chat_history()
        
        # Configure style
        style = ttk.Style()
        # Set modern font family
        default_font = ('noto sans', 10)
        style.configure('.', font=default_font)
        
        # Configure custom styles with modern font and proper dark theme
        style.configure('Custom.TEntry',
                      padding=5,
                      background='#1e1e1e',
                      foreground='white',
                      fieldbackground='#1e1e1e',
                      insertcolor='#00ff00',
                      font=default_font)
        
        style.configure('Custom.TButton',
                      padding=5,
                      background='#333333',
                      foreground='black',
                      font=default_font)
        
        style.configure('TFrame',
                      background='#1e1e1e')
        
        style.configure('TLabel',
                      background='#1e1e1e',
                      foreground='white',
                      font=default_font)
        
        # Configure map to handle button states
        style.map('Custom.TButton',
                 background=[('active', '#444444'), ('pressed', '#555555')],
                 foreground=[('active', 'black'), ('pressed', 'black')])
        
        # Set root window background
        self.root.configure(bg='#1e1e1e')
        
        # Create main frame
        main_frame = ttk.Frame(root, padding="10", style='TFrame')
        main_frame.grid(row=0, column=0, sticky="WENS")
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # API Key frame
        api_frame = ttk.Frame(main_frame, style='TFrame')
        api_frame.grid(row=0, column=0, sticky="WE", pady=(0, 10))
        
        ttk.Label(api_frame, text="API Key:", style='TLabel').pack(side=tk.LEFT)
        self.api_key_entry = tk.Entry(api_frame, 
                                    bg='#1e1e1e',
                                    fg='white',
                                    insertbackground='#00ff00',
                                    relief=tk.SOLID,
                                    borderwidth=1,
                                    font=default_font,
                                    width=42,
                                    show="*")
        self.api_key_entry.pack(side=tk.LEFT, padx=5)
        
        # Configure scrollbar colors for dark theme
        style.configure("Vertical.TScrollbar",
                      background="#333333",
                      arrowcolor="white",
                      troughcolor="#1e1e1e")
        
        style.map("Vertical.TScrollbar",
                background=[('pressed', '#444444'),
                           ('active', '#404040')])
        
        # Configure button size
        style.configure('Custom.TButton',
                      padding=3,
                      background='#333333',
                      foreground='black',
                      font=default_font)
        
        # Load saved API key if exists
        self.load_api_key()
        
        ttk.Button(api_frame, text="Save Key", style='Custom.TButton',
                  command=self.save_api_key).pack(side=tk.LEFT)
        
        # Add System Prompt button
        ttk.Button(api_frame, text="Edit System Prompt", style='Custom.TButton',
                  command=self.edit_system_prompt).pack(side=tk.LEFT, padx=5)
        
        # Add Clear History button
        ttk.Button(api_frame, text="Clear History", style='Custom.TButton',
                  command=self.clear_chat_history).pack(side=tk.LEFT, padx=5)
        
        # Add Profile Picture button
        ttk.Button(api_frame, text="Set GF Picture", style='Custom.TButton',
                  command=self.set_profile_picture).pack(side=tk.LEFT, padx=5)
        
        # Initialize profile picture
        self.profile_picture = None
        self.profile_picture_path = None
        if os.path.exists('profile_picture.png'):
            try:
                image = Image.open('profile_picture.png')
                image = image.resize((30, 30), Image.Resampling.LANCZOS)
                self.profile_picture = ImageTk.PhotoImage(image)
            except Exception as e:
                print(f"Failed to load profile picture: {e}")
        
        # Chat display
        self.chat_display = scrolledtext.ScrolledText(main_frame, wrap=tk.WORD, 
                                                     width=70, height=20,
                                                     bg='#2b2b2b', fg='white',
                                                     insertbackground='white',
                                                     selectbackground='#404040',
                                                     font=default_font,
                                                     relief=tk.SOLID,
                                                     borderwidth=1)
        self.chat_display.grid(row=1, column=0, sticky="WENS")
        
        # Display previous chat history if available
        self.display_chat_history()
        
        # Message input frame
        input_frame = ttk.Frame(main_frame, style='TFrame')
        input_frame.grid(row=2, column=0, sticky="WE", pady=(10, 0))
        
        self.message_entry = tk.Entry(input_frame, 
                                    bg='#1e1e1e',
                                    fg='white',
                                    insertbackground='#00ff00',
                                    relief=tk.SOLID,
                                    borderwidth=1,
                                    font=default_font)
        self.message_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        
        # Configure text cursor color for message entry
        self.message_entry.configure(insertbackground='#00ff00')
        
        # Update chat display cursor color
        self.chat_display.configure(insertbackground='#00ff00')
        send_button = ttk.Button(input_frame, text="Send", style='Custom.TButton',
                                command=self.send_message)
        send_button.pack(side=tk.RIGHT)
        
        # Bind Enter key to send message
        self.message_entry.bind('<Return>', lambda e: self.send_message())
        
        # Configure root window grid
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)
    
    def save_api_key(self):
        api_key = self.api_key_entry.get().strip()
        if api_key:
            try:
                with open('api_key.json', 'w') as f:
                    json.dump({'api_key': api_key}, f)
                messagebox.showinfo("Success", "API key saved successfully!")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save API key: {str(e)}")
    
    def load_api_key(self):
        try:
            if os.path.exists('api_key.json'):
                with open('api_key.json', 'r') as f:
                    data = json.load(f)
                    self.api_key_entry.insert(0, data.get('api_key', ''))
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load API key: {str(e)}")
    
    def load_chat_history(self):
        try:
            if os.path.exists('chat_history.json'):
                with open('chat_history.json', 'r') as f:
                    data = json.load(f)
                    self.chat_history = data.get('conversations', [])
        except Exception as e:
            print(f"Failed to load chat history: {str(e)}")
            self.chat_history = []
    
    def save_chat_history(self):
        try:
            with open('chat_history.json', 'w') as f:
                json.dump({'conversations': self.chat_history}, f, indent=2)
        except Exception as e:
            print(f"Failed to save chat history: {str(e)}")
    
    def set_profile_picture(self):
        file_path = filedialog.askopenfilename(
            title="Select Profile Picture",
            filetypes=[("Image files", "*.png *.jpg *.jpeg *.gif *.bmp")]
        )
        
        if file_path:
            try:
                # Open and resize the image
                image = Image.open(file_path)
                image = image.resize((30, 30), Image.Resampling.LANCZOS)
                
                # Save the resized image
                image.save('profile_picture.png')
                
                # Update the displayed profile picture
                self.profile_picture = ImageTk.PhotoImage(image)
                
                # Copy the image to Chatbot Test folder
                shutil.copy2('profile_picture.png', os.path.join('Chatbot Test', 'profile_picture.png'))
                
                messagebox.showinfo("Success", "Profile picture updated successfully!")
                
                # Refresh the chat display to show the new profile picture
                self.display_chat_history()
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to set profile picture: {str(e)}")
    
    def clear_chat_history(self):
        if messagebox.askyesno("Clear History", "Are you sure you want to clear all chat history? This cannot be undone."):
            self.chat_history = []
            self.save_chat_history()
            self.display_chat_history()
    
    def display_chat_history(self):
        # Clear current display
        self.chat_display.delete('1.0', tk.END)
        
        # Display previous conversations
        for conversation in self.chat_history:
            # Add timestamp if available
            if 'timestamp' in conversation:
                self.chat_display.insert(tk.END, f"--- {conversation['timestamp']} ---\n")
            
            # Add user message without profile picture
            if 'user_message' in conversation:
                self.chat_display.insert(tk.END, f"You: {conversation['user_message']}\n\n")
            
            # Add bot response with profile picture
            if 'bot_response' in conversation:
                if self.profile_picture:
                    self.chat_display.image_create(tk.END, image=self.profile_picture)
                    self.chat_display.insert(tk.END, " ")
                self.chat_display.insert(tk.END, f"GF: {conversation['bot_response']}\n\n")
        
        # Scroll to bottom
        self.chat_display.see(tk.END)
    
    def edit_system_prompt(self):
        # Create a dialog window
        dialog = tk.Toplevel(self.root)
        dialog.title("Edit System Prompt")
        dialog.geometry("600x400")
        dialog.configure(bg='#1e1e1e')  # Set dark background
        
        # Create and configure the text area
        text_area = scrolledtext.ScrolledText(dialog, wrap=tk.WORD, width=70, height=20,
                                             bg='#2b2b2b', fg='white',
                                             insertbackground='white',
                                             selectbackground='#404040',
                                             relief=tk.FLAT)
        text_area.pack(expand=True, fill='both', padx=10, pady=5)
        
        # Load current system prompt
        try:
            if os.path.exists('../system_prompt.json'):
                with open('../system_prompt.json', 'r') as f:
                    data = json.load(f)
                    text_area.insert('1.0', data.get('system_prompt', ''))
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load system prompt: {str(e)}")
        
        # Create button frame
        button_frame = ttk.Frame(dialog, style='TFrame')
        button_frame.pack(fill='x', padx=10, pady=5)
        
        def save_prompt():
            try:
                prompt_text = text_area.get('1.0', tk.END).strip()
                with open('../system_prompt.json', 'w') as f:
                    json.dump({'system_prompt': prompt_text}, f)
                messagebox.showinfo("Success", "System prompt saved successfully!")
                dialog.destroy()
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save system prompt: {str(e)}")
        
        def cancel():
            dialog.destroy()
        
        # Add Save and Cancel buttons
        ttk.Button(button_frame, text="Save", style='Custom.TButton',
                  command=save_prompt).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="Cancel", style='Custom.TButton',
                  command=cancel).pack(side=tk.RIGHT)
        
        # Make dialog modal
        dialog.transient(self.root)
        dialog.grab_set()
        self.root.wait_window(dialog)
    
    def send_message(self):
        message = self.message_entry.get().strip()
        api_key = self.api_key_entry.get().strip()
        
        if not api_key:
            messagebox.showerror("Error", "Please enter your API key")
            return
        
        if not message:
            return
        
        # Create a new conversation entry
        conversation = {
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'user_message': message
        }
        
        # Display user message without profile picture
        self.chat_display.insert(tk.END, "You: " + message + "\n\n")
        self.message_entry.delete(0, tk.END)
        
        try:
            # Load system prompt
            system_prompt = ""
            try:
                if os.path.exists('../system_prompt.json'):
                    with open('../system_prompt.json', 'r') as f:
                        data = json.load(f)
                        system_prompt = data.get('system_prompt', '')
            except Exception as e:
                print(f"Failed to load system prompt: {str(e)}")
            
            # Configure the API
            genai.configure(api_key=api_key, transport='rest')
            
            # Create generation config
            generation_config = genai.GenerationConfig(
                temperature=0.7,
                top_p=0.8,
                top_k=40
            )
            
            # Safety settings removed to allow unrestricted conversations
            safety_settings = [
                # Using the most permissive settings
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                }
            ]
            
            # Initialize the model with configurations
            model = genai.GenerativeModel(
                #gemini-2.0-pro-exp-02-05
                #gemini-1.5-pro-latest - old
                model_name='gemini-2.0-pro-exp-02-05',
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            # Start a chat session
            chat = model.start_chat()
            
            # Set system prompt if available
            if system_prompt:
                chat.send_message(system_prompt)
            
            # Send user message and get response
            response = chat.send_message(message)
            
            # Add bot response to conversation entry
            conversation['bot_response'] = response.text
            
            # Display bot response
            self.chat_display.insert(tk.END, "GF: " + response.text + "\n\n")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get response: {str(e)}")
            self.chat_display.insert(tk.END, "Bot: Sorry, I encountered an error.\n\n")
            # Add error response to conversation entry
            conversation['bot_response'] = "Sorry, I encountered an error."
        
        # Add conversation to history and save
        self.chat_history.append(conversation)
        self.save_chat_history()
        
        # Scroll to bottom
        self.chat_display.see(tk.END)

def main():
    root = tk.Tk()
    app = ChatbotGUI(root)
    root.mainloop()
    
    # Save chat history when application closes
    app.save_chat_history()

if __name__ == "__main__":
    main()
