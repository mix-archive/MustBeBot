import {
  Alert,
  AlertIcon,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Container,
  Divider,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  Stepper,
  Text,
} from '@chakra-ui/react'
import {
  redirect,
  json,
  type LoaderArgs,
  type ActionArgs,
} from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import CanvasCaptcha from '~/components/CanvasCaptcha'
import { commitSession, getSession, FLAG } from '~/sessions'

const DIFFICULTY = 2,
  OPERATORS = ['+', '-', '*', '/'] as const

export const loader = async ({ params, request }: LoaderArgs) => {
  const session = await getSession(request.headers.get('Cookie')),
    currentStep = +(params['*'] ?? 1),
    sessionStep = session.get('step')

  const squareApproachLength = Math.ceil(Math.sqrt(FLAG.length)),
    measuredTotalSteps = squareApproachLength + 1,
    leftFillFlag = FLAG.padStart(1 << squareApproachLength, '>'),
    revealedFlag = leftFillFlag.slice(
      0,
      (1 - 1 / (1 << (currentStep - 1))) * (1 << squareApproachLength)
    )
  if (!Number.isInteger(currentStep) || !Number.isInteger(sessionStep)) {
    return redirect('/')
  }

  if (currentStep !== sessionStep) {
    return redirect(`/step/${sessionStep}`)
  }

  const questions: Record<string, string> = {},
    answers: Record<string, number> = {},
    difficulty = 1 << (DIFFICULTY + currentStep),
    random = () => Math.floor(Math.random() * difficulty)

  while (Object.keys(questions).length < difficulty) {
    const operator = OPERATORS[(Math.random() * OPERATORS.length) | 0],
      questionId = Math.random().toString(16).slice(2)

    let question: string, answer: number

    switch (operator) {
      case '+':
        const addend = random(),
          augend = random()
        question = `${addend} + ${augend} = ?`
        answer = addend + augend
        break
      case '-':
        answer = random()
        const minuend = random(),
          subtrahend = minuend + answer
        question = `${subtrahend} - ${minuend} = ?`
        break
      case '*':
        const multiplicand = random(),
          multiplier = random()
        question = `${multiplicand} * ${multiplier} = ?`
        answer = multiplicand * multiplier
        break
      case '/':
        answer = random()
        const dividend = random(),
          divisor = dividend * answer
        question = `${divisor} / ${dividend} = ?`
        break
    }

    questions[questionId] = question
    answers[questionId] = answer
  }

  session.set('answer', answers)

  return json(
    {
      step: { current: currentStep, total: measuredTotalSteps },
      flag: { reveal: revealedFlag, length: leftFillFlag.length },
      flash: session.get('error'),
      questions,
    },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    }
  )
}

export const action = async ({ request }: ActionArgs) => {
  const session = await getSession(request.headers.get('Cookie')),
    answer = session.get('answer'),
    body = await request.formData(),
    currentStep = session.get('step')

  if (!answer || !currentStep) {
    session.flash('error', 'No answer found in session')
    return redirect(request.url, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    })
  }

  const wrongAnswers = Object.entries(answer).filter(
    ([id, answer]) =>
      !body.has(`answer_${id}`) || +body.get(`answer_${id}`)! !== answer
  )

  if (wrongAnswers.length > 0) {
    session.flash('error', 'Wrong answer')
    return redirect(request.url, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    })
  }

  session.set('step', currentStep + 1)
  return redirect(`/step/${currentStep + 1}`, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}

export default function StepPage() {
  const { step, flag, flash, questions } = useLoaderData<typeof loader>()
  return (
    <>
      <Flex
        width={'100vw'}
        paddingTop={'10'}
        direction={'column'}
        alignItems={'center'}
      >
        {flash && (
          <Alert status="error" marginBottom={'10'} width={'90%'}>
            <AlertIcon />
            {flash}
          </Alert>
        )}
        <Container maxW={'3xl'} paddingBottom={'10'}>
          <Stepper index={step.current - 1}>
            {Array.from({ length: step.total }, (_, i) => (
              <Step key={i}>
                <StepIndicator>
                  <StepStatus
                    complete={<StepIcon />}
                    active={<StepNumber />}
                    incomplete={<StepNumber />}
                  ></StepStatus>
                </StepIndicator>

                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        </Container>
        <Card marginBottom={'10'}>
          <CardHeader>
            <Heading>🎉 Congratulations!</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Text fontWeight={200} paddingBottom={'10px'}>
              You have revealed {flag.reveal.length}/{flag.length} of flag!
            </Text>
            <Input
              variant={'filled'}
              value={flag.reveal}
              fontFamily={'monospace'}
              placeholder="Revealed flag will be here"
              onChange={() => {}}
            ></Input>
          </CardBody>
        </Card>
        <Card width={'95%'}>
          <CardHeader>
            <Heading size={'md'} fontWeight={100}>
              Please fill up the captcha below to reveal more flag
            </Heading>
            <CardBody>
              <Form
                method="post"
                action={`/step/${step.current}`}
                reloadDocument
              >
                <SimpleGrid columns={{ base: 2, xl: 3 }} spacing={10}>
                  {Object.entries(questions).map(([id, question]) => (
                    <Card key={id}>
                      <CardBody>
                        <Center>
                          <CanvasCaptcha
                            code={question}
                            width={300}
                            height={100}
                          ></CanvasCaptcha>
                        </Center>
                      </CardBody>
                      <CardBody>
                        <Input
                          name={`answer_${id}`}
                          placeholder="Answer"
                          inputMode="numeric"
                        ></Input>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
                <Button marginTop={10} type="submit">
                  Submit
                </Button>
              </Form>
            </CardBody>
          </CardHeader>
        </Card>
      </Flex>
    </>
  )
}
