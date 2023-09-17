from itertools import count
import re
import requests
import json

CONTENT_RE = re.compile(r"window\.__remixContext\s*=\s*(?P<data>\{.*\});")
CALC_RE = re.compile(r"(\d+)\s*([+\-*/])\s*(\d+)\s*=\s*\?")

session = requests.Session()
base_url = "http://ctf.buptmerak.cn:20032/"

session.get(base_url)
print(session.cookies.get_dict())

for step in count(1):
    response = session.get(base_url + f"step/{step}")
    content = CONTENT_RE.search(response.text)
    if content is None:
        print(response.text)
        break
    data = json.loads(content["data"])
    loader_content = data["state"]["loaderData"]["routes/step.$"]
    flag = loader_content["flag"]["reveal"]
    total = loader_content["step"]["total"]
    questions = loader_content["questions"]
    print(f"Step {step}: {flag!r} {len(flag)=}")
    answers = {}
    for key, value in questions.items():
        key = f"answer_{key}"
        match = CALC_RE.search(value)
        if match is None:
            print(f"Unknown question: {value}")
            continue
        a, op, b = match.groups()
        a, b = int(a), int(b)
        if op == "+":
            answers[key] = a + b
        elif op == "-":
            answers[key] = a - b
        elif op == "*":
            answers[key] = a * b
        elif op == "/":
            answers[key] = a // b
        else:
            print(f"Unknown operator: {op}")
    response = session.post(response.url, data=answers)
    print(response.history)
    data = CONTENT_RE.search(response.text)["data"]  # type: ignore
    data = json.loads(data)
    errors = data["state"]["loaderData"]["routes/step.$"].get("flash")
    if errors is not None:
        print(errors)
