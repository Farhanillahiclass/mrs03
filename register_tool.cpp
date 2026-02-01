#include <iostream>
#include <string>

using namespace std;

int main() {
    string name, email, password, roleChoice, role, adminKey;
    string secret = "MRS_ADMIN_2026";

    cout << "--- MRS Registration Payload Generator (C++) ---" << endl;
    
    cout << "Enter Name: ";
    getline(cin, name);
    
    cout << "Enter Email: ";
    getline(cin, email);
    
    cout << "Enter Password: ";
    getline(cin, password);
    
    cout << "Select Role (1: Student, 2: Teacher, 3: Admin): ";
    getline(cin, roleChoice);

    if (roleChoice == "3") {
        role = "Admin";
        adminKey = secret;
    } else if (roleChoice == "2") {
        role = "Teacher";
    } else {
        role = "Student";
    }

    // Construct JSON manually
    string json = "{";
    json += "\"name\": \"" + name + "\",";
    json += "\"email\": \"" + email + "\",";
    json += "\"password\": \"" + password + "\",";
    json += "\"role\": \"" + role + "\"";
    if (role == "Admin") {
        json += ",\"adminKey\": \"" + adminKey + "\"";
    }
    json += "}";

    cout << "\nGenerated JSON Payload:\n" << json << endl;
    cout << "\nTo execute with CURL:\ncurl -X POST http://localhost:8000/api/register -H \"Content-Type: application/json\" -d '" << json << "'" << endl;

    return 0;
}